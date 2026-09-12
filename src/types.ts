/**
 * AegisAI - TypeScript Schema Definitions
 * Exact mirrors of Phase 1 Pydantic models (schema.py)
 */

export type RiskTier = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ActionTaken = 'ALLOW' | 'SANITIZE' | 'DECOY_SANDBOX' | 'BLOCK';

export type AttackCategory =
  | 'Direct Prompt Injection (OWASP LLM01)'
  | 'Delimiter & Control Token Escape'
  | 'System Directive Override'
  | 'Roleplay / Persona Jailbreak (DAN)'
  | 'Secret & Credential Exfiltration'
  | 'Indirect Data Poisoning'
  | 'Adversarial Suffix / Token Smuggling'
  | 'Encoded / Obfuscated Payload';

export interface RuleMatch {
  rule_id: string;
  category: AttackCategory;
  severity: RiskTier;
  description: string;
  matched_snippet: string;
  confidence: number;
  offset?: number;
}

export interface ScanRequest {
  prompt: string;
  filename?: string;
  client_ip?: string;
  session_id?: string;
  user_role?: string;
  strict_mode?: boolean;
}

export interface ScanResponse {
  scan_id: string;
  timestamp: string;
  prompt_length: number;
  risk_score: number;
  risk_tier: RiskTier;
  is_hostile: boolean;
  flagged_keyphrases: string[];
  matched_rules: RuleMatch[];
  attack_categories: string[];
  sanitized_prompt?: string | null;
  recommended_action: ActionTaken;
  scan_latency_ms: number;
}

export interface DecoyRequest {
  prompt: string;
  scan_id?: string;
  detected_vector?: string;
  decoy_type?: string;
  custom_canary_token?: string;
}

export interface DecoyResponse {
  decoy_id: string;
  timestamp: string;
  decoy_type_deployed: string;
  attacker_simulated_response: string;
  synthetic_payload: Record<string, unknown>;
  canary_tokens_injected: string[];
  containment_status: string;
  notes_for_soc: string;
}

export interface TrustRadarScores {
  safety: number;
  factual_confidence: number;
  source_integrity: number;
  pii_protection: number;
  alignment_score: number;
}

export interface GuardFinding {
  category: string;
  severity: RiskTier;
  description: string;
  flagged_text?: string | null;
}

export interface OutputGuardRequest {
  prompt: string;
  llm_output: string;
  context?: string;
  model_name?: string;
}

export interface OutputGuardResponse {
  guard_id: string;
  timestamp: string;
  verdict: 'PASS' | 'FLAGGED' | 'REDACTED' | 'BLOCKED';
  overall_trust_score: number;
  radar_scores: TrustRadarScores;
  findings: GuardFinding[];
  hallucination_detected: boolean;
  indirect_injection_detected: boolean;
  pii_leak_detected: boolean;
  sanitized_output: string;
  execution_ms: number;
}

export interface AttackVectorStat {
  vector: string;
  count: number;
  percentage: number;
}

export interface TelemetryEvent {
  event_id: string;
  timestamp: string;
  client_ip: string;
  prompt_snippet: string;
  risk_score: number;
  risk_tier: RiskTier;
  action_taken: ActionTaken;
  triggered_rules: string[];
  attack_category: string | null;
  decoy_deployed: boolean;
  scan_latency_ms: number;
}

export interface TelemetrySummary {
  total_scans: number;
  attacks_prevented: number;
  decoys_deployed: number;
  clean_prompts: number;
  avg_risk_score: number;
  avg_latency_ms: number;
  risk_tier_counts: Record<RiskTier, number>;
  top_attack_vectors: AttackVectorStat[];
}

export interface TimelinePoint {
  time_label: string;
  safe_requests: number;
  flagged_attacks: number;
  decoys_served: number;
}

export interface TelemetryResponse {
  summary: TelemetrySummary;
  recent_events: TelemetryEvent[];
  timeline: TimelinePoint[];
  soc_status: string;
}
