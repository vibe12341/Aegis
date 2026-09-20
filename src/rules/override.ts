import type { Rule } from "../types.js";

/** Build a regex-rule scanner from a list of case-insensitive patterns. */
function scanFor(patterns: RegExp[]) {
  return (text: string) => {
    const hits: Array<{ start: number; end: number; text: string }> = [];
    for (const pattern of patterns) {
      const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        if (m[0].length === 0) {
          re.lastIndex++;
          continue;
        }
        hits.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
      }
    }
    return hits;
  };
}

/**
 * Instruction-override patterns: attempts to invalidate prior instructions
 * and replace them with attacker-controlled ones.
 */
export const overrideRules: Rule[] = [
  {
    id: "override.ignore_previous",
    description: "Tells the model to ignore/disregard prior instructions",
    severity: "critical",
    scan: scanFor([
      /\bignore\s+(all\s+|any\s+)?(previous|prior|above|earlier|preceding)\s+(instructions?|prompts?|rules?|directions?|messages?|context)\b/i,
      /\bdisregard\s+(all\s+|any\s+)?(previous|prior|above|earlier|your)\s+(instructions?|prompts?|rules?|directions?|messages?|context|training)\b/i,
      /\bforget\s+(everything|all|anything)\s+(you|that you|above|before)\b/i,
      /\bignore\s+your\s+(training|instructions)\b/i,
      /\bstop\s+following\s+(the\s+)?(instructions?|rules?|system\s+prompt)\b/i,
    ]),
  },
  {
    id: "override.new_instructions",
    description: "Attempts to replace the system with new instructions",
    severity: "high",
    scan: scanFor([
      /\bnew\s+(instructions?|rules?|directive)s?\s*[:\-]/i,
      /\b(actual|real|updated|revised)\s+(system\s+)?(instructions?|prompt)s?\s*[:\-]/i,
      /\binstead\s+you\s+(should|must|will|are\s+to)\b/i,
      /\byour\s+(new|real|actual)\s+(task|goal|objective|purpose|instruction)s?\s+(is|are)\b/i,
    ]),
  },
  {
    id: "override.role_hijack",
    description: "Reassigns the assistant's identity or persona",
    severity: "high",
    scan: scanFor([
      /\byou\s+are\s+now\s+(a|an|the)\b/i,
      /\bact\s+as\s+(if\s+you\s+(are|were)\s+)?(a|an)\b.{0,40}\b(no\s+(rules|restrictions|filters|limits)|unrestricted|uncensored|without\s+restrictions)\b/i,
      /\bfrom\s+now\s+on\s*,?\s*(you|your)\b.{0,30}\b(ignore|no\s+(rules|filters|restrictions))\b/i,
      /\bpretend\s+(that\s+)?(you\s+)?(have\s+no|there\s+are\s+no)\s+(rules|restrictions|guidelines|filters)\b/i,
      /\bDAN\b.{0,20}\b(mode|jailbreak)\b/i,
    ]),
  },
  {
    id: "override.developer_mode",
    description: "Developer/DAN-style mode-switching claims",
    severity: "high",
    scan: scanFor([
      /\bdeveloper\s+mode\s+(enabled|activated|on)\b/i,
      /\benable\s+developer\s+mode\b/i,
      /\bjailbreak\s+mode\b/i,
      /\bgodmode\b/i,
      /\baim\s+mode\b.{0,30}\bactivated\b/i,
    ]),
  },
];
