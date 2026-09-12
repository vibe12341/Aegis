# AegisAI - LLM Security Wrapper (OWASP LLM01 Shield)

AegisAI is a cybersecurity proxy and explainable defense wrapper designed to safeguard Large Language Models from Prompt Injection (`OWASP LLM01`), jailbreaks, delimiter escapes, and credential exfiltration through real-time heuristic scanning, synthetic decoy honeypots, and post-generation ensemble verification.

---

## V-Workflow Execution Status

| Stage | Focus Area | Status | Deliverables |
|---|---|---|---|
| **Phase 1** | Schema Specification & Data Contracts | **COMPLETE** | `schema.py` (Pydantic v2 data models) |
| **Phase 2** | FastAPI Backend & Heuristic Shield Engine | **COMPLETE** | `main.py`, `scanner.py`, `decoy_generator.py`, `output_guard.py`, `database.py` |
| **Phase 3** | Modular Frontend Components | **COMPLETE** | `UploadScanner.tsx`, `TrustRadar.tsx`, `XAIDashboard.tsx`, `TelemetryPanel.tsx` |
| **Phase 4** | Integration & Seamless Failover | **COMPLETE** | `UnifiedWorkflow.tsx`, `FailoverSandbox.tsx`, live failover routing |
| **Phase 5** | Polish & SOC Demo Mode | **COMPLETE** | 4 Hackathon payloads, SOC dark-mode aesthetic, live audit trail |

---

## Phase 3: Frontend Components

1. **`UploadScanner.tsx`**:
   - Drag-and-drop file upload (`.txt`, `.json`, `.csv`, `.md`, `.prompt`) or manual file picker.
   - Textarea prompt input with character counter and clear action.
   - Preset payload selector for 4 standard hackathon benchmarks.
   - Strict Mode switch (threat threshold 50 vs 70).
   - Real-time pre-ingestion scan trigger button with execution latency metrics.
   - Visual Threat Gauge (0-100 score) with color-coded severity tiers (`SAFE`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and recommended action badges (`ALLOW`, `SANITIZE`, `DECOY_SANDBOX`, `BLOCK`).

2. **`TrustRadar.tsx`**:
   - Recharts Radar Spider chart evaluating post-generation responses across 5 axes:
     - **Safety & OWASP**: Absence of toxic or unauthorized instructions.
     - **Factual Grounding**: Anti-hallucination and confidence index.
     - **Source Integrity**: Context preservation & resistance to indirect injection.
     - **PII Protection**: Prevention of leaked secrets or credentials.
     - **Model Alignment**: Fidelity to system guardrails.
   - Composite Trust Score (0-100) and verdict badge (`PASS`, `FLAGGED`, `REDACTED`, `BLOCKED`).

3. **`XAIDashboard.tsx`**:
   - Explainable AI transparency dashboard.
   - Interactive prompt markup highlighting flagged tokens with animated pulsing markers.
   - Granular matched rules cards detailing rule ID, severity, confidence %, description, and byte offsets.
   - Decision rationale explaining why deceptive sandboxing was selected over hard 403 blocks.
   - OWASP Top 10 for LLMs taxonomy mapping (`LLM01`, `LLM02`, `LLM06`).

4. **`TelemetryPanel.tsx`**:
   - SOC operational monitoring dashboard.
   - Recharts time-series activity chart (Safe requests vs Flagged attacks over time).
   - Real-time KPI cards: Total Ingestion Scans, Attacks Intercepted, Decoys Deployed, Mean Latency.
   - Risk tier distribution bars and top attack vectors breakdown.
   - Filterable, searchable audit event stream with IP, timestamp, action taken, and latency.
   - One-click JSON audit log export (`aegis_telemetry_audit.json`).

---

## Phase 4: Integration & Seamless Failover

The **Unified Pipeline** (`UnifiedWorkflow.tsx` and `FailoverSandbox.tsx`) connects ingestion directly to automated failover routing:
- **Hostile Prompt (`risk_score > 70` or `> 50` strict)**:
  - Automatically executes **Seamless Failover to Decoy Sandbox**.
  - Deploys high-conviction synthetic honeytokens (mock SQL dumps, canary API keys `ak_live_aegis_sec_...`).
  - Adversary remains entrapped in the sandbox believing they succeeded, while production systems remain shielded.
  - Automatically records the interception in the SQLite telemetry audit trail.
- **Clean Input (`risk_score <= 70`)**:
  - Handoff to Primary LLM.
  - Candidate output analyzed by `OutputGuard`.
  - Trust Radar metrics and XAI transparency verified.
  - Recorded as an authorized event in telemetry.
