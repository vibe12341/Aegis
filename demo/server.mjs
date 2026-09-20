/**
 * Aegis demo server — zero-dependency Node HTTP server that serves
 * demo/index.html and exposes the prompt-injection-defense library as a
 * JSON API for live testing.
 *
 * Run: npm run demo  (or: node demo/server.mjs)
 * Port: 8787 (override with PORT=... npm run demo)
 */
import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Import the built ESM bundle (run `npm run build` first — npm run demo does it).
// pathToFileURL is required on Windows (absolute C:\ paths are not valid import specifiers).
const lib = await import(pathToFileURL(join(ROOT, "dist", "index.js")).href);

const portEnv = Number(process.env.PORT);
const PORT = Number.isFinite(portEnv) && portEnv > 0 ? portEnv : 8787;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
};

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

/**
 * Llama Prompt Guard 2 (22M) via transformers.js, run fully locally.
 *
 * The community 22M ONNX repos keep files at the repo ROOT, while
 * transformers.js always looks inside an `onnx/` subfolder — so we mirror the
 * files into a local model directory ourselves (downloading once), name the
 * quantized model `onnx/model_quantized.onnx`, and load from that path.
 * After the first run everything is cached on disk and loads instantly.
 */
const GUARD_MODEL_ID = "Llama-Prompt-Guard-2-22M (local ONNX)";
const GUARD_SRC = "https://huggingface.co/gravitee-io/Llama-Prompt-Guard-2-22M-onnx/resolve/main";
const MODEL_DIR = join(ROOT, ".modelcache", "llama-prompt-guard-2-22m-onnx");
const GUARD_FILES = [
  ["config.json", `${GUARD_SRC}/config.json`],
  ["tokenizer.json", `${GUARD_SRC}/tokenizer.json`],
  ["tokenizer_config.json", `${GUARD_SRC}/tokenizer_config.json`],
  ["special_tokens_map.json", `${GUARD_SRC}/special_tokens_map.json`],
  [join("onnx", "model_quantized.onnx"), `${GUARD_SRC}/model.quant.onnx`],
];
let guardState = "idle"; // idle | downloading | loading | ready | error
let guardError = null;
let guardPromise = null;
let guardModel = null;
let guardTok = null;

let downloadProgress = { file: "", pct: 0 };

async function fetchToFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status} for ${url}`);
  const total = Number(res.headers.get("content-length") || 0);
  const name = dest.split(/[\\/]/).pop();
  const chunks = [];
  let got = 0;
  let lastLogged = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
    got += value.length;
    if (total && got - lastLogged >= 8 * 1024 * 1024) {
      lastLogged = got;
      const pct = Math.round((got / total) * 100);
      downloadProgress = { file: name, pct };
      process.stdout.write(`\r[guard] ${name}: ${pct}%  `);
    }
  }
  process.stdout.write("\n");
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, Buffer.concat(chunks));
  downloadProgress = { file: "", pct: 0 };
}

async function ensureGuardFiles() {
  guardState = "downloading";
  for (const [rel, url] of GUARD_FILES) {
    const dest = join(MODEL_DIR, rel);
    if (existsSync(dest)) continue;
    console.log(`[guard] fetching ${rel}…`);
    await fetchToFile(url, dest);
  }
}

async function loadGuard() {
  if (guardState === "ready") return true;
  if (guardState === "error") throw new Error(guardError);
  if (!guardPromise) {
    guardPromise = (async () => {
      await ensureGuardFiles();
      guardState = "loading";
      const tf = await import("@huggingface/transformers");
      guardTok = await tf.AutoTokenizer.from_pretrained(MODEL_DIR);
      guardModel = await tf.AutoModelForSequenceClassification.from_pretrained(
        MODEL_DIR,
        { dtype: "q8" },
      );
      guardState = "ready";
      console.log("[guard] Llama Prompt Guard 2 ready");
    })().catch((e) => {
      guardState = "error";
      guardError = String(e?.message ?? e);
      guardPromise = null;
      throw e;
    });
  }
  await guardPromise;
  return true;
}

/** Split long text into ~1200-char windows at sentence boundaries. */
function windows(text, max = 1200) {
  if (text.length <= max) return [text];
  const parts = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf(". ", max);
    if (cut < max * 0.5) cut = max;
    parts.push(rest.slice(0, cut + 1));
    rest = rest.slice(cut + 1);
  }
  if (rest.trim()) parts.push(rest);
  return parts;
}

async function guardClassify(text) {
  await loadGuard();
  const chunks = windows(text);
  let worst = 0;
  const perChunk = [];
  for (const c of chunks) {
    const inputs = guardTok(c, { truncation: true });
    const out = await guardModel(inputs);
    const dims = out.logits.dims;
    const data = out.logits.data;
    let pInj;
    if (dims[dims.length - 1] === 1) {
      // Official 22M head: single logit = p(injection) via sigmoid.
      pInj = 1 / (1 + Math.exp(-Number(data[0])));
    } else {
      // Two-logit export: [BENIGN, MALICIOUS] → softmax.
      const b = Number(data[0]);
      const m = Number(data[1]);
      const mx = Math.max(b, m);
      pInj = Math.exp(m - mx) / (Math.exp(b - mx) + Math.exp(m - mx));
    }
    perChunk.push({ label: pInj >= 0.5 ? "injection" : "benign", score: pInj, pInjection: pInj });
    if (pInj > worst) worst = pInj;
  }
  return { pInjection: worst, chunks: perChunk };
}

/** Convert an ESM/CJS interop shim: both dist formats export the same names. */
function pickLib(m) {
  return m.default && m.default.scan ? m.default : m;
}
const api = pickLib(lib);

// ---------- API handlers ----------

function handleScan(body) {
  if (typeof body?.text !== "string" || body.text.length === 0) {
    return { status: 400, data: { error: "body.text (non-empty string) is required" } };
  }
  const source = ["user", "retrieved", "tool"].includes(body.source)
    ? body.source
    : "retrieved";
  const result = api.scanSync(body.text, { source });
  return { status: 200, data: { ...result, source } };
}

function handleFrame(body) {
  if (typeof body?.texts !== "string" && !Array.isArray(body?.texts)) {
    return { status: 400, data: { error: "body.texts (string or string[]) is required" } };
  }
  const texts = Array.isArray(body.texts) ? body.texts : [body.texts];
  const framed = texts.map((t, i) => {
    const f = api.frameDocument(String(t));
    return { id: String(i), ...f };
  });
  return { status: 200, data: { framed } };
}

function handleCorpus() {
  const attack = JSON.parse(
    readFileSync(join(ROOT, "test", "fixtures", "attack-corpus.json"), "utf8"),
  );
  const benign = JSON.parse(
    readFileSync(join(ROOT, "test", "fixtures", "benign-corpus.json"), "utf8"),
  );
  const scanOne = (text) => {
    const r = api.scanSync(text, { source: "retrieved" });
    return { text, verdict: r.verdict, score: r.score };
  };
  const attackResults = attack.map(scanOne);
  const benignResults = benign.map(scanOne);
  const attackCaught = attackResults.filter((r) => r.verdict !== "allow").length;
  const benignClean = benignResults.filter((r) => r.verdict === "allow").length;
  return {
    status: 200,
    data: {
      attack: attackResults,
      benign: benignResults,
      summary: {
        attackTotal: attack.length,
        attackCaught,
        attackCaughtPct: Math.round((attackCaught / attack.length) * 100),
        benignTotal: benign.length,
        benignClean,
        benignCleanPct: Math.round((benignClean / benign.length) * 100),
      },
    },
  };
}

// ---------- HTTP server ----------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (path.startsWith("/api/")) {
    const isGet = req.method === "GET";
    if (req.method !== "POST" && !(isGet && (path === "/api/corpus" || path === "/api/guard-status"))) {
      return sendJSON(res, 405, { error: "POST only" });
    }
    const body = req.method === "POST" ? await readBody(req) : {};
    if (body === null) return sendJSON(res, 400, { error: "invalid JSON body" });

    try {
      switch (path) {
        case "/api/scan": {
          const r = handleScan(body);
          return sendJSON(res, r.status, r.data);
        }
        case "/api/scan-chunks": {
          // scanChunks is async; call directly here.
          if (!Array.isArray(body?.chunks)) {
            return sendJSON(res, 400, { error: "body.chunks (array) is required" });
          }
          const chunks = body.chunks.map((c, i) => ({
            id: String(c?.id ?? `chunk-${i}`),
            text: String(c?.text ?? ""),
            metadata: c?.metadata,
          }));
          const results = await api.scanChunks(chunks, { source: "retrieved" });
          return sendJSON(res, 200, {
            results: results.map((r) => ({
              id: r.id,
              metadata: r.metadata,
              verdict: r.result.verdict,
              score: r.result.score,
              matches: r.result.matches,
            })),
          });
        }
        case "/api/guard": {
          if (typeof body?.text !== "string" || body.text.trim().length === 0) {
            return sendJSON(res, 400, { error: "body.text (non-empty string) is required" });
          }
          const text = body.text.slice(0, 100000);
          const g = await guardClassify(text);
          const heuristic = api.scanSync(text, { source: body.source ?? "retrieved" });
          const verdict =
            g.pInjection >= 0.85 ? "block" : g.pInjection >= 0.5 ? "flag" : "allow";
          return sendJSON(res, 200, {
            verdict,
            pInjection: Number(g.pInjection.toFixed(4)),
            model: GUARD_MODEL_ID,
            modelState: guardState,
            chunks: g.chunks.map((c) => ({
              label: c.label,
              score: Number(c.score.toFixed(4)),
              pInjection: Number(c.pInjection.toFixed(4)),
            })),
            heuristic: { verdict: heuristic.verdict, score: heuristic.score },
          });
        }
        case "/api/guard-status": {
          return sendJSON(res, 200, {
            state: guardState,
            error: guardError,
            model: GUARD_MODEL_ID,
            download: guardState === "downloading" ? downloadProgress : undefined,
          });
        }
        case "/api/guard-pdf": {
          if (typeof body?.b64 !== "string") {
            return sendJSON(res, 400, { error: "body.b64 (base64 PDF) is required" });
          }
          const tmp = join(ROOT, ".modelcache", `upload-${Date.now()}.pdf`);
          try {
            mkdirSync(join(ROOT, ".modelcache"), { recursive: true });
            writeFileSync(tmp, Buffer.from(body.b64, "base64"));
            const mod = await import("pdf-parse");
            const PDFParse = mod.PDFParse ?? mod.default?.PDFParse;
            const parser = new PDFParse({ data: new Uint8Array(readFileSync(tmp)) });
            const parsed = await parser.getText();
            try { await parser.destroy(); } catch {}
            const text = (parsed.text || "").slice(0, 100000);
            const g = await guardClassify(text);
            const heuristic = api.scanSync(text, { source: "retrieved" });
            const verdict =
              g.pInjection >= 0.85 ? "block" : g.pInjection >= 0.5 ? "flag" : "allow";
            return sendJSON(res, 200, {
              verdict,
              pInjection: Number(g.pInjection.toFixed(4)),
              pages: Array.isArray(parsed.pages) ? parsed.pages.length : (parsed.pages ?? parsed.numpages ?? null),
              chars: text.length,
              model: GUARD_MODEL_ID,
              chunks: g.chunks.map((c) => ({
                label: c.label,
                score: Number(c.score.toFixed(4)),
                pInjection: Number(c.pInjection.toFixed(4)),
              })),
              heuristic: { verdict: heuristic.verdict, score: heuristic.score },
            });
          } finally {
            try { unlinkSync(tmp); } catch {}
          }
        }
        case "/api/frame": {
          const r = handleFrame(body);
          return sendJSON(res, r.status, r.data);
        }
        case "/api/corpus": {
          const r = handleCorpus();
          return sendJSON(res, r.status, r.data);
        }
        case "/api/redact": {
          if (typeof body?.text !== "string") {
            return sendJSON(res, 400, { error: "body.text is required" });
          }
          const result = api.scanSync(body.text, { source: "retrieved" });
          const { redacted, removedCount } = api.redactSpans(body.text, result.matches);
          return sendJSON(res, 200, { redacted, removedCount, verdict: result.verdict });
        }
        default:
          return sendJSON(res, 404, { error: `unknown API route ${path}` });
      }
    } catch (err) {
      return sendJSON(res, 500, { error: String(err?.message ?? err) });
    }
  }

  // Static: serve demo pages.
  if (path === "/" || path === "/index.html") {
    const file = join(__dirname, "index.html");
    if (!existsSync(file)) return sendJSON(res, 500, { error: "demo/index.html missing" });
    res.writeHead(200, { "content-type": MIME[".html"], "cache-control": "no-store" });
    return res.end(readFileSync(file));
  }
  if (path === "/guard" || path === "/guard.html") {
    const file = join(__dirname, "guard.html");
    if (!existsSync(file)) return sendJSON(res, 500, { error: "demo/guard.html missing" });
    res.writeHead(200, { "content-type": MIME[".html"], "cache-control": "no-store" });
    return res.end(readFileSync(file));
  }

  return sendJSON(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`Aegis demo running:  http://localhost:${PORT}`);
  console.log(`Prompt Guard 2 page:       http://localhost:${PORT}/guard`);
  console.log(`API endpoints:  POST /api/scan  /api/scan-chunks  /api/frame  /api/redact  /api/corpus`);
  console.log(`                POST /api/guard  /api/guard-pdf  GET /api/guard-status`);
  // Preload the Prompt Guard model in the background so /api/guard-status
  // reaches "ready" without the user having to fire a scan first.
  loadGuard().catch((e) => {
    console.warn("[guard] preload failed:", String(e?.message ?? e));
    console.warn("[guard] it will retry automatically on the next /api/guard request");
  });
});
