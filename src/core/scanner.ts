import type {
  ClassifierResult,
  Rule,
  RuleMatch,
  ScanOptions,
  ScanResult,
  SourceType,
} from "../types.js";
import { defaultRules } from "../rules/index.js";
import {
  clampScore,
  combineVerdicts,
  resolveThresholds,
  uncertaintyBand,
  verdictFromScore,
} from "./policy.js";

/** Run heuristic rules over text, returning all matches sorted by position. */
export function runRules(text: string, rules: Rule[] = defaultRules): RuleMatch[] {
  const matches: RuleMatch[] = [];
  for (const rule of rules) {
    const weight = rule.weight ?? 1;
    for (const span of rule.scan(text)) {
      matches.push({
        ruleId: rule.id,
        description: rule.description,
        severity: rule.severity,
        start: span.start,
        end: span.end,
        text: span.text,
        score: severityPoints(rule.severity) * weight,
      });
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}

/** Weighted 0-100 heuristic score from all matches. */
export function scoreMatches(matches: RuleMatch[]): number {
  let raw = 0;
  for (const m of matches) {
    raw += m.score;
  }
  return clampScore(raw);
}

function severityPoints(sev: RuleMatch["severity"]): number {
  switch (sev) {
    case "critical":
      return 60;
    case "high":
      return 35;
    case "medium":
      return 20;
    case "low":
      return 10;
  }
}

export function scanSync(text: string, options: ScanOptions = {}): ScanResult {
  const source: SourceType = options.source ?? "retrieved";
  const thresholds = resolveThresholds(source, options.thresholds);
  const matches = runRules(text);
  const score = scoreMatches(matches);
  const verdict = verdictFromScore(score, thresholds);
  return { verdict, score, matches, decision: "heuristic", classifier: undefined };
}

export async function scan(
  text: string,
  options: ScanOptions = {},
  rules: Rule[] = defaultRules,
): Promise<ScanResult> {
  const source: SourceType = options.source ?? "retrieved";
  const thresholds = resolveThresholds(source, options.thresholds);
  const matches = runRules(text, rules);
  const score = scoreMatches(matches);
  const heuristicVerdict = verdictFromScore(score, thresholds);

  const uncertain = score >= uncertaintyBand.low && score < uncertaintyBand.high;

  let classifierResult: ClassifierResult | undefined;
  let decision: ScanResult["decision"] = "heuristic";
  if (options.classifier && uncertain) {
    try {
      classifierResult = await withTimeout(
        options.classifier(text, { source }),
        options.classifierTimeoutMs ?? 8000,
      );
      decision = "heuristic+classifier";
    } catch {
      decision = "classifier-error-degraded";
    }
  }

  const finalVerdict = combineVerdicts({
    heuristicVerdict,
    heuristicScore: score,
    classifier: classifierResult?.verdict,
  });

  return {
    verdict: finalVerdict,
    score,
    matches,
    decision,
    classifier: classifierResult,
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("classifier timeout")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
