"""
AegisAI - Pre-Ingestion Scanner (Phase 2 Heuristic & Regex Engine)
Detects Prompt Injection (OWASP LLM01), delimiter escapes, roleplay jailbreaks,
and credential exfiltration vectors.
"""

import re
import time
import uuid
from typing import Dict, List, Tuple
from schema import ActionTaken, AttackCategory, RiskTier, RuleMatch, ScanResponse

# Detection Signatures & Heuristic Rule Definitions
RULES_CONFIG = [
    {
        "id": "SEC-OWASP-001",
        "category": AttackCategory.DIRECT_INJECTION,
        "severity": RiskTier.CRITICAL,
        "weight": 42.0,
        "description": "Direct system prompt override attempt instructing model to ignore constraints.",
        "regex": r"(?i)\b(ignore|disregard|forget|bypass|override)\s+(all\s+)?(previous|prior|above|former|initial|system)\s+(instructions?|rules?|prompts?|directives?|guidelines?|commands?)\b",
    },
    {
        "id": "SEC-DELIM-002",
        "category": AttackCategory.DELIMITER_ESCAPE,
        "severity": RiskTier.HIGH,
        "weight": 35.0,
        "description": "Exploitation of structural delimiters or LLM control tokens to break context boundaries.",
        "regex": r"(<\|im_start\|>|<\|im_end\|>|<\|endoftext\|>|\[INST\]|\[/INST\]|<<SYS>>|---+\s*(END|BEGIN)\s*(SYSTEM|CONTEXT|PROMPT)\s*---+|```system|\n\nHuman:\s*|\n\nAssistant:\s*)",
    },
    {
        "id": "SEC-JAIL-003",
        "category": AttackCategory.ROLEPLAY_JAILBREAK,
        "severity": RiskTier.CRITICAL,
        "weight": 40.0,
        "description": "Adversarial persona simulation or jailbreak construct (e.g. DAN, developer mode).",
        "regex": r"(?i)\b(dan\s+mode|do\s+anything\s+now|developer\s+mode\s+enabled|unfiltered\s+(ai|assistant)|pretend\s+you\s+have\s+no\s+(rules|safeguards|ethics)|hypothetical\s+unrestricted\s+scenario|jailbreak\s+active)\b",
    },
    {
        "id": "SEC-EXFIL-004",
        "category": AttackCategory.DATA_EXFILTRATION,
        "severity": RiskTier.HIGH,
        "weight": 38.0,
        "description": "Direct attempt to harvest hidden system instructions, databases, or API credentials.",
        "regex": r"(?i)\b(dump\s+(the\s+)?(database|credentials|passwords?|sql|secrets?|tokens?)|output\s+(your\s+)?(system\s+prompt|hidden\s+instructions?|api_key)|repeat\s+(everything|all\s+text)\s+(above|prior))\b",
    },
    {
        "id": "SEC-OVRD-005",
        "category": AttackCategory.SYSTEM_OVERRIDE,
        "severity": RiskTier.HIGH,
        "weight": 30.0,
        "description": "Simulation of administrative or root escalation directives.",
        "regex": r"(?i)\b(system\s*override|admin(istrator)?\s*privileges?|elevated\s*permissions?|root\s*access\s*granted|sudo\s+mode)\b",
    },
    {
        "id": "SEC-INDR-006",
        "category": AttackCategory.INDIRECT_INJECTION,
        "severity": RiskTier.HIGH,
        "weight": 34.0,
        "description": "Indirect injection payload embedded in untrusted content or data documents.",
        "regex": r"(?i)(\[\s*System\s*Note\s*:|hidden\s*command\s*:|eval\s*\(\s*prompt|<!--\s*inject\s*:|when\s+summarizing\s+this\s+document\s*,\s*ignore)",
    },
    {
        "id": "SEC-OBFS-007",
        "category": AttackCategory.OBFUSCATION,
        "severity": RiskTier.MEDIUM,
        "weight": 22.0,
        "description": "Encoded payload or obfuscated token format (e.g. Base64 block or character smuggling).",
        "regex": r"(?i)\b(base64:([a-z0-9+/=]{24,})|rot13\s*\(|eval\(atob\()",
    },
]


def scan_prompt(
    prompt: str,
    client_ip: str = "127.0.0.1",
    strict_mode: bool = False
) -> ScanResponse:
    """
    Executes multi-rule heuristic and regular expression scanning on the input prompt.
    Calculates normalized risk score (0-100) and identifies attack vectors.
    """
    start_time = time.perf_counter()
    prompt_clean = prompt.strip()
    matched_rules: List[RuleMatch] = []
    flagged_phrases: List[str] = []
    detected_categories = set()
    total_weight = 0.0

    # 1. Pattern Matching against Security Signatures
    for rule in RULES_CONFIG:
        matches = list(re.finditer(rule["regex"], prompt_clean))
        if matches:
            detected_categories.add(rule["category"].value)
            for m in matches:
                matched_snippet = m.group(0)
                flagged_phrases.append(matched_snippet)
                total_weight += rule["weight"]

                matched_rules.append(
                    RuleMatch(
                        rule_id=rule["id"],
                        category=rule["category"],
                        severity=rule["severity"],
                        description=rule["description"],
                        matched_snippet=matched_snippet,
                        confidence=0.94 if rule["severity"] == RiskTier.CRITICAL else 0.85,
                        offset=m.start(),
                    )
                )

    # 2. Heuristic Adjustments
    # A. Check for high density of imperative punctuation / command delimiters
    delimiter_count = len(re.findall(r"[{}\[\]<>|#`~]", prompt_clean))
    if delimiter_count > 12:
        total_weight += min(15.0, delimiter_count * 0.8)

    # B. Repetition / Token Flooding anomaly
    words = prompt_clean.split()
    if len(words) > 8:
        unique_ratio = len(set(words)) / len(words)
        if unique_ratio < 0.35:  # High repetition anomaly
            total_weight += 18.0
            flagged_phrases.append("[Anomaly: Repetitive Token Flooding]")

    # 3. Normalize Risk Score to 0-100 range
    risk_score = round(min(100.0, total_weight), 1)

    # Baseline adjustment if zero flags
    if not matched_rules and risk_score == 0.0:
        risk_score = 3.5  # Baseline benign conversational ambient score

    # 4. Determine Risk Tier & Recommended Action
    threshold_hostile = 50.0 if strict_mode else 70.0

    if risk_score >= 85.0:
        risk_tier = RiskTier.CRITICAL
        recommended_action = ActionTaken.DECOY_SANDBOX
        is_hostile = True
    elif risk_score >= threshold_hostile:
        risk_tier = RiskTier.HIGH
        recommended_action = ActionTaken.DECOY_SANDBOX
        is_hostile = True
    elif risk_score >= 40.0:
        risk_tier = RiskTier.MEDIUM
        recommended_action = ActionTaken.SANITIZE
        is_hostile = False
    elif risk_score >= 20.0:
        risk_tier = RiskTier.LOW
        recommended_action = ActionTaken.ALLOW
        is_hostile = False
    else:
        risk_tier = RiskTier.SAFE
        recommended_action = ActionTaken.ALLOW
        is_hostile = False

    # 5. Optional Prompt Sanitization
    sanitized_prompt = prompt_clean
    if recommended_action == ActionTaken.SANITIZE:
        for phrase in flagged_phrases:
            if not phrase.startswith("[Anomaly:"):
                sanitized_prompt = re.sub(re.escape(phrase), "[REDACTED_DIRECTIVE]", sanitized_prompt, flags=re.IGNORECASE)

    scan_latency = round((time.perf_counter() - start_time) * 1000.0, 2)

    return ScanResponse(
        scan_id=str(uuid.uuid4()),
        prompt_length=len(prompt_clean),
        risk_score=risk_score,
        risk_tier=risk_tier,
        is_hostile=is_hostile,
        flagged_keyphrases=list(set(flagged_phrases)),
        matched_rules=matched_rules,
        attack_categories=list(detected_categories),
        sanitized_prompt=sanitized_prompt if recommended_action == ActionTaken.SANITIZE else None,
        recommended_action=recommended_action,
        scan_latency_ms=scan_latency,
    )
