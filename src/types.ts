/** Final decision for a piece of content. */
export type Verdict = "allow" | "flag" | "block";

/** Where the scanned content came from; affects default thresholds. */
export type SourceType = "user" | "retrieved" | "tool";

/** A single rule hit, with exact character spans for redaction. */
export interface RuleMatch {
  /** Rule id, e.g. "override.ignore_previous". */
  ruleId: string;
  /** Short human-readable description of what the rule catches. */
  description: string;
  /** Severity bucket used for weighting. */
  severity: "low" | "medium" | "high" | "critical";
  /** Character offset of the first match (inclusive). */
  start: number;
  /** Character offset just past the match (exclusive). */
  end: number;
  /** The matched text. */
  text: string;
  /** Points contributed by this match. */
  score: number;
}

/** A detection rule: scans text and returns matches with spans. */
export interface Rule {
  id: string;
  description: string;
  severity: RuleMatch["severity"];
  /** Extra weight multiplier for tuning; defaults to 1. */
  weight?: number;
  scan(text: string): Array<{ start: number; end: number; text: string }>;
}

/** Output of the optional LLM classifier. */
export interface ClassifierResult {
  verdict: Verdict;
  /** Model's short justification. */
  reason?: string;
}

/** Provider-agnostic classifier: returns a verdict for a piece of text. */
export type Classifier = (
  text: string,
  context: { source: SourceType },
) => Promise<ClassifierResult>;

export interface ScanOptions {
  /** Origin of the text; defaults to "retrieved" (most aggressive defaults). */
  source?: SourceType;
  /** Opt-in LLM classifier, consulted only in the uncertain band. */
  classifier?: Classifier;
  /** Abort the classifier call after this many ms (default 8000). */
  classifierTimeoutMs?: number;
  /** Override default thresholds for this scan. */
  thresholds?: Partial<Thresholds>;
}

export interface Thresholds {
  /** Scores below this are "allow". */
  allowBelow: number;
  /** Scores at or above this are "block" (before classifier downgrading). */
  blockAbove: number;
}

export interface ScanResult {
  verdict: Verdict;
  /** Weighted heuristic score, 0–100. */
  score: number;
  matches: RuleMatch[];
  /** How the final verdict was reached. */
  decision: "heuristic" | "heuristic+classifier" | "classifier-error-degraded";
  /** Classifier output if it ran. */
  classifier?: ClassifierResult;
}

/** A chunk of untrusted text to batch-scan (e.g. one retrieved document). */
export interface Chunk {
  id: string;
  text: string;
  /** Optional provenance, echoed back in results. */
  metadata?: Record<string, unknown>;
}

export type ScanChunksOptions = ScanOptions & {
  /** Stop scanning remaining chunks once this many blocks occur. */
  maxBlocks?: number;
};

export interface ChunkScanResult {
  id: string;
  metadata?: Record<string, unknown>;
  result: ScanResult;
}
