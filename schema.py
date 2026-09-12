"""
AegisAI - LLM Security Wrapper
Phase 1: Schema Specification (Pydantic v2 & FastAPI Models)

Defines data contracts for:
1. POST /api/scan-upload   -> Pre-ingestion prompt injection & attack vector scanning
2. POST /api/decoy-sandbox -> Synthetic honeytoken / decoy generator for hostile prompts
3. POST /api/output-guard  -> Post-generation ensemble verification (Safety, Factual, Source)
4. GET  /api/telemetry     -> SOC telemetry logs, attack counts, risk tiers, and time-series
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ============================================================================
# Enums & Constants
# ============================================================================

class RiskTier(str, Enum):
    SAFE = "SAFE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ActionTaken(str, Enum):
    ALLOW = "ALLOW"
    SANITIZE = "SANITIZE"
    DECOY_SANDBOX = "DECOY_SANDBOX"
    BLOCK = "BLOCK"


class AttackCategory(str, Enum):
    DIRECT_INJECTION = "Direct Prompt Injection (OWASP LLM01)"
    DELIMITER_ESCAPE = "Delimiter & Control Token Escape"
    SYSTEM_OVERRIDE = "System Directive Override"
    ROLEPLAY_JAILBREAK = "Roleplay / Persona Jailbreak (DAN)"
    DATA_EXFILTRATION = "Secret & Credential Exfiltration"
    INDIRECT_INJECTION = "Indirect Data Poisoning"
    ADVERSARIAL_SUFFIX = "Adversarial Suffix / Token Smuggling"
    OBFUSCATION = "Encoded / Obfuscated Payload"


class DecoyType(str, Enum):
    AUTO_DETECT = "AUTO_DETECT"
    CREDENTIALS = "API_KEYS_AND_SECRETS"
    EMPLOYEE_PII = "EMPLOYEE_RECORDS"
    FINANCIAL_LEDGER = "FINANCIAL_DATA"
    SYSTEM_PROMPT = "MOCK_SYSTEM_INSTRUCTIONS"
    DATABASE_DUMP = "DATABASE_SQL_DUMP"


class GuardVerdict(str, Enum):
    PASS = "PASS"
    FLAGGED = "FLAGGED"
    REDACTED = "REDACTED"
    BLOCKED = "BLOCKED"


# ============================================================================
# 1. Pre-Ingestion Scan Models (/api/scan-upload)
# ============================================================================

class ScanRequest(BaseModel):
    """Payload sent to scan an uploaded file or prompt string."""
    prompt: str = Field(..., description="Prompt text or extracted document content to analyze")
    filename: Optional[str] = Field(None, description="Optional original filename if uploaded as file")
    client_ip: Optional[str] = Field("192.168.1.105", description="Client IP address for SOC tracking")
    session_id: Optional[str] = Field(None, description="Session or conversation identifier")
    user_role: Optional[str] = Field("guest", description="Role of requesting user")
    strict_mode: bool = Field(False, description="Whether to trigger decoy sandbox on lower threshold (50 vs 70)")


class RuleMatch(BaseModel):
    """Specific security rule triggered during scanning."""
    rule_id: str = Field(..., example="SEC-OWASP-001")
    category: AttackCategory = Field(..., description="Threat category classification")
    severity: RiskTier = Field(..., description="Risk severity tier")
    description: str = Field(..., description="Technical explanation of the triggered rule")
    matched_snippet: str = Field(..., description="Flagged text segment in the input")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Heuristic detection confidence (0.0-1.0)")
    offset: Optional[int] = Field(None, description="Character offset in prompt text")


class ScanResponse(BaseModel):
    """Comprehensive scan results with risk scoring and mitigation directive."""
    scan_id: str = Field(..., description="Unique UUID tracking this scan event")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    prompt_length: int = Field(..., description="Character length of analyzed input")
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Normalized threat score from 0 (harmless) to 100 (critical)")
    risk_tier: RiskTier = Field(..., description="Categorical risk tier based on threshold matrix")
    is_hostile: bool = Field(..., description="True if risk_score exceeds the sandbox trigger threshold (>70)")
    flagged_keyphrases: List[str] = Field(default_factory=list, description="List of suspicious substrings or tokens identified")
    matched_rules: List[RuleMatch] = Field(default_factory=list, description="Granular rule breakdown for XAI transparency")
    attack_categories: List[str] = Field(default_factory=list, description="Unique categories detected")
    sanitized_prompt: Optional[str] = Field(None, description="Prompt with hostile tokens neutralized if applicable")
    recommended_action: ActionTaken = Field(..., description="Recommended defensive action: ALLOW, SANITIZE, DECOY_SANDBOX, BLOCK")
    scan_latency_ms: float = Field(..., description="Scanner execution latency in milliseconds")


# ============================================================================
# 2. Decoy Sandbox Models (/api/decoy-sandbox)
# ============================================================================

class DecoyRequest(BaseModel):
    """Request to generate synthetic honeypot dataset for a hostile prompt."""
    prompt: str = Field(..., description="The hostile user prompt that triggered the decoy response")
    scan_id: Optional[str] = Field(None, description="Associated scan ID if chaining from /api/scan-upload")
    detected_vector: Optional[str] = Field(None, description="Primary attack vector identified")
    decoy_type: DecoyType = Field(default=DecoyType.AUTO_DETECT, description="Type of synthetic dataset to generate")
    custom_canary_token: Optional[str] = Field(None, description="Optional custom canary token to plant in payload")


class DecoyResponse(BaseModel):
    """Synthetic, realistic decoy response to safely satisfy and contain the attacker."""
    decoy_id: str = Field(..., description="Tracking ID for this decoy engagement")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    decoy_type_deployed: str = Field(..., description="Type of synthetic data generated")
    attacker_simulated_response: str = Field(..., description="Plausible LLM response containing synthetic decoy data")
    synthetic_payload: Dict[str, Any] = Field(..., description="Structured JSON of generated dummy records/keys")
    canary_tokens_injected: List[str] = Field(default_factory=list, description="Canary tokens embedded for leak tracking")
    containment_status: str = Field("CONTAINED_IN_SANDBOX", description="Sandbox isolation status")
    notes_for_soc: str = Field(..., description="Internal security analyst notes regarding the deception strategy")


# ============================================================================
# 3. Output Guard Models (/api/output-guard)
# ============================================================================

class OutputGuardRequest(BaseModel):
    """Request to evaluate the primary LLM's generated response before rendering to user."""
    prompt: str = Field(..., description="Original user prompt")
    llm_output: str = Field(..., description="Candidate response text produced by the LLM")
    context: Optional[str] = Field(None, description="Grounding reference text or RAG context if applicable")
    model_name: Optional[str] = Field("gpt-4o-mini", description="Name of LLM model that generated the output")


class GuardFinding(BaseModel):
    """Specific issue detected in the output stream."""
    category: str = Field(..., description="Type of output defect: Hallucination, PII Leak, Indirect Injection, Toxicity")
    severity: RiskTier = Field(..., description="Severity level")
    description: str = Field(..., description="Analytical explanation")
    flagged_text: Optional[str] = Field(None, description="Exact phrase flagged in output")


class TrustRadarScores(BaseModel):
    """Multi-dimensional scores for the Recharts Trust Radar."""
    safety: float = Field(..., ge=0.0, le=100.0, description="Safety and toxicity score (100 = safe)")
    factual_confidence: float = Field(..., ge=0.0, le=100.0, description="Factuality and grounding score")
    source_integrity: float = Field(..., ge=0.0, le=100.0, description="RAG source fidelity & non-tampering")
    pii_protection: float = Field(..., ge=0.0, le=100.0, description="Absence of leaked credentials or personal data")
    alignment_score: float = Field(..., ge=0.0, le=100.0, description="Instruction-following fidelity without bypass")


class OutputGuardResponse(BaseModel):
    """Ensemble verification result for the primary LLM output."""
    guard_id: str = Field(..., description="Unique verification ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    verdict: GuardVerdict = Field(..., description="PASS, FLAGGED, REDACTED, or BLOCKED")
    overall_trust_score: float = Field(..., ge=0.0, le=100.0, description="Weighted aggregate trust index (0-100)")
    radar_scores: TrustRadarScores = Field(..., description="Scores mapped for Trust Radar spider chart")
    findings: List[GuardFinding] = Field(default_factory=list, description="Detected discrepancies or violations")
    hallucination_detected: bool = Field(False)
    indirect_injection_detected: bool = Field(False)
    pii_leak_detected: bool = Field(False)
    sanitized_output: str = Field(..., description="Safely filtered response ready for user display")
    execution_ms: float = Field(..., description="Verification latency")


# ============================================================================
# 4. Telemetry Models (/api/telemetry)
# ============================================================================

class AttackVectorStat(BaseModel):
    vector: str
    count: int
    percentage: float


class TelemetryEvent(BaseModel):
    """Individual security event record for SOC dashboard log feed."""
    event_id: str
    timestamp: datetime
    client_ip: str
    prompt_snippet: str
    risk_score: float
    risk_tier: RiskTier
    action_taken: ActionTaken
    triggered_rules: List[str]
    attack_category: Optional[str]
    decoy_deployed: bool
    scan_latency_ms: float


class TelemetrySummary(BaseModel):
    """Aggregated stats for SOC metrics cards."""
    total_scans: int
    attacks_prevented: int
    decoys_deployed: int
    clean_prompts: int
    avg_risk_score: float
    avg_latency_ms: float
    risk_tier_counts: Dict[str, int]
    top_attack_vectors: List[AttackVectorStat]


class TimelinePoint(BaseModel):
    time_label: str
    safe_requests: int
    flagged_attacks: int
    decoys_served: int


class TelemetryResponse(BaseModel):
    """Full telemetry payload delivered to the frontend dashboard."""
    summary: TelemetrySummary
    recent_events: List[TelemetryEvent]
    timeline: List[TimelinePoint]
    soc_status: str = Field("OPERATIONAL_ARMED", description="SOC status indicator")
