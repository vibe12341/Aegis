# Aegis — Prompt Injection Defense

Detects prompt injection in untrusted text, retrieved documents, and PDFs using a
two-engine pipeline: a fast heuristic scanner plus Meta's **Llama Prompt Guard 2 (22M)**
running locally via ONNX (transformers.js) — no data ever leaves the host.

## Pages

| Route | What it is |
|---|---|
| `/` | Live Scanner hero — paste text or tap a sample, see verdict + score meter |
| `/guard` | Prompt Guard 2 console — text classification and PDF upload (parsed server-side) |

## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/scan` | POST | Heuristic scan. `{text, source}` → verdict, score, rule matches with spans |
| `/api/redact` | POST | Strip flagged fragments, return cleaned text |
| `/api/scan-chunks` | POST | Batch scan an array of chunks |
| `/api/frame` | POST | Nonce-frame documents for injection-resistant RAG prompts |
| `/api/corpus` | GET | Run all 70 corpus samples, return summary |
| `/api/guard` | POST | Prompt Guard 2 classification. `{text}` → p(injection), per-chunk scores |
| `/api/guard-pdf` | POST | `{b64}` base64 PDF → parsed text → classification |
| `/api/guard-status` | GET | Model load state (`idle/downloading/loading/ready/error`) |

## Run locally

```bash
npm install
npm run demo          # builds the library, then serves on PORT (default 8787)
```

First visit to `/guard` triggers a one-time ~72 MB model download into `.modelcache/`
(served from disk afterward; startup preloads it when cached).

## Deploy (Render)

The repo root contains `render.yaml` (Blueprint). In the Render dashboard:
**New → Blueprint**, point it at this repo, and Render reads the config —
free web service, `npm ci && npm run build`, starts `npm start`, and honors
the platform-injected `PORT`. The model downloads into a local disk on first
boot; attach a persistent disk at `/opt/aegis/.modelcache` to skip re-downloads
after redeploys.
