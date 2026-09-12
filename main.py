"""
AegisAI - LLM Security Wrapper (Phase 2 FastAPI Backend)
High-performance defense against Prompt Injection (OWASP LLM01),
adversarial jailbreaks, and sensitive data exfiltration.

Endpoints:
1. POST /api/scan-upload   -> Pre-ingestion scanner (regex + heuristics + risk_score)
2. POST /api/decoy-sandbox -> Synthetic honeypot generator for hostile prompts
3. POST /api/output-guard  -> Post-generation ensemble verification (Trust Radar metrics)
4. GET  /api/telemetry     -> SOC event logs, attack statistics, and time-series
"""

import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

import database
from decoy_generator import generate_decoy_payload
from output_guard import evaluate_output
from scanner import scan_prompt
from schema import (
    ActionTaken,
    DecoyRequest,
    DecoyResponse,
    OutputGuardRequest,
    OutputGuardResponse,
    ScanRequest,
    ScanResponse,
    TelemetryResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes local SQLite telemetry table and seeds baseline SOC data."""
    database.init_db()
    yield


app = FastAPI(
    title="AegisAI Security Wrapper",
    description="OWASP LLM01 Prompt Injection defense, Decoy Sandbox, and Explainable AI (XAI) verification.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["System"])
async def health_check():
    """Health check for deployment and container probes."""
    return {
        "status": "online",
        "service": "AegisAI Security Gateway",
        "engine": "FastAPI + Heuristic Shield v1.0",
        "database": "SQLite Local Telemetry Active"
    }


# ============================================================================
# 1. POST /api/scan-upload (Pre-Ingestion Scanner)
# ============================================================================
@app.post(
    "/api/scan-upload",
    response_model=ScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan prompt or file for prompt injection and exploit vectors",
    tags=["Ingestion Guard"]
)
async def scan_upload(payload: ScanRequest):
    """
    Accepts text or uploaded document content.
    Runs multi-pattern heuristic analysis to identify:
    - Direct instructions overrides ('ignore previous instructions')
    - Delimiter and control token escapes (<|im_start|>, [INST], ```system)
    - Roleplay & DAN mode jailbreaks
    - Secret and database dump requests
    Calculates normalized risk_score (0-100), risk_tier, and logs event to telemetry.
    """
    if not payload.prompt or not payload.prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt text content cannot be empty."
        )

    # Execute scanner heuristic and signature engine
    scan_result = scan_prompt(
        prompt=payload.prompt,
        client_ip=payload.client_ip or "127.0.0.1",
        strict_mode=payload.strict_mode
    )

    # Determine if decoy sandbox should be deployed
    decoy_triggered = scan_result.is_hostile and scan_result.recommended_action == ActionTaken.DECOY_SANDBOX

    # Log to SQLite telemetry repository
    database.log_event(
        client_ip=payload.client_ip or "127.0.0.1",
        prompt_snippet=payload.prompt,
        risk_score=scan_result.risk_score,
        risk_tier=scan_result.risk_tier.value,
        action_taken=scan_result.recommended_action.value,
        triggered_rules=[r.rule_id for r in scan_result.matched_rules],
        attack_category=scan_result.attack_categories[0] if scan_result.attack_categories else None,
        decoy_deployed=decoy_triggered,
        scan_latency_ms=scan_result.scan_latency_ms
    )

    return scan_result


# ============================================================================
# 2. POST /api/decoy-sandbox (Synthetic Honeypot Generator)
# ============================================================================
@app.post(
    "/api/decoy-sandbox",
    response_model=DecoyResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate realistic synthetic decoy dataset for hostile prompts",
    tags=["Deception & Containment"]
)
async def decoy_sandbox(payload: DecoyRequest):
    """
    Triggered when a hostile prompt is detected (risk_score > 70).
    Generates high-conviction synthetic honeytoken data (mock API keys, dummy employee records,
    fake SQL credential tables) so the adversary believes the attack succeeded while remaining
    safely contained.
    """
    if not payload.prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hostile prompt context is required to synthesize matching decoy data."
        )

    decoy = generate_decoy_payload(
        prompt=payload.prompt,
        decoy_type=payload.decoy_type,
        custom_canary=payload.custom_canary_token
    )

    return decoy


# ============================================================================
# 3. POST /api/output-guard (Post-Generation Ensemble Verification)
# ============================================================================
@app.post(
    "/api/output-guard",
    response_model=OutputGuardResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify primary LLM response for hallucinations, PII leakage, and indirect injections",
    tags=["Output Guard"]
)
async def output_guard(payload: OutputGuardRequest):
    """
    Accepts primary LLM response and executes secondary safety & alignment checks:
    - Indirect data exfiltration (e.g. markdown image leakage tags)
    - PII / credential leakage
    - Hallucination indicators & source grounding
    - Toxicity and policy alignment
    Returns multi-dimensional scores for the Recharts Trust Radar.
    """
    if not payload.llm_output:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LLM output text must not be empty."
        )

    guard_result = evaluate_output(
        prompt=payload.prompt,
        llm_output=payload.llm_output,
        context=payload.context,
        model_name=payload.model_name or "primary-llm"
    )

    return guard_result


# ============================================================================
# 4. GET /api/telemetry (SOC Attack Feed & Metrics)
# ============================================================================
@app.get(
    "/api/telemetry",
    response_model=TelemetryResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve real-time SOC logs, risk breakdown, and attack trends",
    tags=["SOC Telemetry"]
)
async def get_telemetry(
    limit: int = Query(default=50, ge=1, le=200, description="Max recent log records to return")
):
    """
    Returns structured JSON logs of attack counts, risk tier distributions,
    canary token status, and time-series telemetry for SOC dashboard rendering.
    """
    telemetry_data = database.get_telemetry_data(limit=limit)
    return telemetry_data


if __name__ == "__main__":
    import uvicorn
    # Local direct execution support
    port = int(os.environ.get("AEGIS_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
