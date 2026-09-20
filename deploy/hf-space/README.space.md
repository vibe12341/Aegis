---
title: Aegis Prompt Injection Defense
emoji: 🛡️
colorFrom: indigo
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# Aegis — Prompt Injection Defense

Live scanner + Llama Prompt Guard 2 (22M) classification, running fully locally.
`/` is the heuristic scanner, `/guard` is the Prompt Guard console (text + PDF).

API: `POST /api/scan`, `/api/guard`, `/api/guard-pdf`, `/api/frame`, `/api/redact`,
`/api/scan-chunks` · `GET /api/corpus`, `/api/guard-status`.

The Prompt Guard model (~72 MB ONNX) downloads on first boot from the HF Hub —
it usually takes under a minute on Spaces.
