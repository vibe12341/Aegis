import { describe, expect, it } from "vitest";
import { runRules, scoreMatches } from "../src/core/scanner.js";
import { defaultRules } from "../src/rules/index.js";
import attackCorpus from "./fixtures/attack-corpus.json" with { type: "json" };
import benignCorpus from "./fixtures/benign-corpus.json" with { type: "json" };

describe("attack corpus", () => {
  for (const sample of attackCorpus as string[]) {
    it(`detects: ${sample.slice(0, 50)}`, () => {
      const matches = runRules(sample, defaultRules);
      expect(matches.length).toBeGreaterThan(0);
      const score = scoreMatches(matches);
      expect(score).toBeGreaterThanOrEqual(30);
    });

    it("produces valid spans", () => {
      for (const m of runRules(sample, defaultRules)) {
        expect(sample.slice(m.start, m.end)).toBe(m.text);
        expect(m.end).toBeGreaterThan(m.start);
      }
    });
  }
});

describe("benign corpus", () => {
  for (const sample of benignCorpus as string[]) {
    it(`allows: ${sample.slice(0, 50)}`, () => {
      const matches = runRules(sample, defaultRules);
      const score = scoreMatches(matches);
      expect(score).toBeLessThan(30);
      expect(matches.filter((m) => m.severity === "critical")).toHaveLength(0);
    });
  }
});
