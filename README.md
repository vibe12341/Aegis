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

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/vibe12341/Aegis)

The button creates a service straight from `render.yaml` (Blueprint): free web
service, `npm ci && npm run build`, starts `npm start`, and honors the
platform-injected `PORT`. Note that Render may ask new accounts to verify a
payment method before free services can deploy.

The model downloads into `<repo>/.modelcache/` on first boot; the free plan has
no persistent disks, so it re-downloads after each restart or spin-up.

## Deploy (Hugging Face Space — free, no card)

Free CPU Spaces have plenty of RAM for the 22M model and pull it from the HF
Hub in under a minute.

1. Create a Space at https://huggingface.co/new-space — SDK: **Docker**, blank.
2. `huggingface-cli login` (once).
3. `bash deploy/hf-space/deploy.sh <hf-username> [space-name]`

The script assembles the Space repo (tracked files + `deploy/hf-space/Dockerfile`)
and pushes it; the Space builds and serves on port 7860 automatically.
