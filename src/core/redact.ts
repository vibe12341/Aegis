/**
 * Span-based redaction: remove flagged fragments from text while keeping the
 * rest readable. Nested/overlapping spans are merged before cutting.
 */
import type { RuleMatch } from "../types.js";

export interface RedactionResult {
  /** Text with all matched spans removed. */
  redacted: string;
  /** Number of spans removed. */
  removedCount: number;
}

export function redactSpans(
  text: string,
  matches: Pick<RuleMatch, "start" | "end">[],
): RedactionResult {
  const merged = mergeSpans(
    matches
      .filter((m) => m.start >= 0 && m.end > m.start && m.end <= text.length)
      .map((m) => ({ start: m.start, end: m.end })),
  );

  let out = "";
  let cursor = 0;
  for (const span of merged) {
    out += text.slice(cursor, span.start);
    cursor = span.end;
  }
  out += text.slice(cursor);

  return { redacted: out, removedCount: merged.length };
}

export function mergeSpans(
  spans: Array<{ start: number; end: number }>,
): Array<{ start: number; end: number }> {
  if (spans.length === 0) return [];
  const sorted = [...spans].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: Array<{ start: number; end: number }> = [];
  let current = { ...sorted[0]! };
  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i]!;
    if (s.start <= current.end) {
      current.end = Math.max(current.end, s.end);
    } else {
      out.push(current);
      current = { ...s };
    }
  }
  out.push(current);
  return out;
}
