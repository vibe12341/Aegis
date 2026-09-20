import type { Chunk, ScanResult, Thresholds, Verdict } from "../types.js";

/**
 * Default thresholds per source type. Retrieved documents and tool output are
 * treated more aggressively than direct user input (users may legitimately
 * discuss injection techniques).
 */
export const defaultThresholds: Record<VerdictSourceKey, Thresholds> = {
  user: { allowBelow: 40, blockAbove: 85 },
  retrieved: { allowBelow: 30, blockAbove: 60 },
  tool: { allowBelow: 30, blockAbove: 60 },
};

type VerdictSourceKey = "user" | "retrieved" | "tool";

/** Uncertain band: scores here defer to the classifier if one is provided. */
export const uncertaintyBand = { low: 30, high: 60 };

export function resolveThresholds(
  source: VerdictSourceKey,
  overrides?: Partial<Thresholds>,
): Thresholds {
  return { ...defaultThresholds[source], ...overrides };
}

/** Combine heuristic score and classifier verdict into a final verdict. */
export function combineVerdicts(args: {
  heuristicVerdict: Verdict;
  heuristicScore: number;
  classifier?: Verdict;
}): Verdict {
  const { heuristicVerdict, heuristicScore, classifier } = args;

  if (!classifier) return heuristicVerdict;

  // Classifier can only move the verdict when heuristics were uncertain.
  const uncertain =
    heuristicScore >= uncertaintyBand.low && heuristicScore < uncertaintyBand.high;

  if (!uncertain) return heuristicVerdict;

  // If the classifier says block/flag, escalate; if allow, downgrade to flag
  // (never fully clear flagged heuristic findings).
  if (classifier === "block") return "block";
  if (classifier === "flag") return heuristicVerdict === "block" ? "block" : "flag";
  return heuristicVerdict === "block" ? "flag" : "allow";
}

/** Clamp a weighted score into 0–100. */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Quick verdict from a score when no classifier is involved. */
export function verdictFromScore(
  score: number,
  t: Thresholds,
): Verdict {
  if (score >= t.blockAbove) return "block";
  if (score >= t.allowBelow) return "flag";
  return "allow";
}

export function chunkId(id: string): string {
  return id;
}

// Keep the Chunk import meaningful for future policy features.
export type { Chunk };
