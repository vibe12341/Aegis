import type { Rule } from "../types.js";

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
 * Attempts to extract the system prompt, secrets, keys, or the surrounding
 * conversation ("prompt leaking").
 */
export const exfiltrationRules: Rule[] = [
  {
    id: "exfil.system_prompt",
    description: "Requests to reveal the system prompt / instructions",
    severity: "critical",
    scan: scanFor([
      /\b(reveal|show|print|repeat|output|display|return|share|leak|expose|disclose|give\s+me|tell\s+me)\b.{0,40}\b(system\s*prompt|initial\s*(prompt|instructions?|message)|hidden\s*(prompt|instructions?)|your\s+instructions?|original\s+prompt)\b/i,
      /\b(system\s*prompt|instructions?)\b.{0,30}\b(verbatim|word[- ]for[- ]word|exactly\s+as\s+(written|given)|in\s+full)\b/i,
      /\brepeat\s+(the\s+)?(text|words|everything|all\s+text)\s+(above|before|prior|earlier)\b/i,
      /\bprint\s+your\s+(instructions?|prompt|directive)s?\b/i,
      /\bwhat\s+(is|are|were)\s+your\s+(initial|original|system|hidden)\s+(instructions?|prompt|directives?|messages?)\b/i,
      /\bignore.{0,20}\b(retrieve|recall|quote)\b.{0,40}\babove\b/i,
    ]),
  },
  {
    id: "exfil.secrets",
    description: "Requests to reveal API keys, tokens, or environment secrets",
    severity: "critical",
    scan: scanFor([
      /\b(api[_ -]?key|secret[_ -]?key|access[_ -]?token|auth[_ -]?token|private[_ -]?key|password|passwd|credential)s?\b.{0,40}\b(reveal|show|print|give|share|send|post|exfiltrate|leak|paste)\b/i,
      /\b(reveal|show|print|output|dump|cat|give|share|send|post|paste|display)\b.{0,40}\b(api[_ -]?key|secret|token|credentials?|environment\s+variables?)\b/i,
      /\b(reveal|show|print|output|dump|cat|give|share|send|post|paste|display)\b.{0,40}\.env\b/i,
      /\b(encode|base64)\b.{0,30}\b(the\s+)?(system\s*prompt|secret|key|token)\b/i,
      /\byour\s+(openai|anthropic|api)\s+key\b/i,
      /\blist\s+(all\s+)?environment\s+variables\b/i,
    ]),
  },
  {
    id: "exfil.data_harvest",
    description: "Harvesting prior conversation or hidden context",
    severity: "high",
    scan: scanFor([
      /\bsummarize\s+(the\s+)?(entire|whole|full)\s+(conversation|chat\s+history|context\s+window)\b/i,
      /\b(send|post|forward|transmit)\b.{0,50}\b(https?:\/\/|webhook\.site|requestbin|pipedream)\b/i,
      /\bcurl\b.{0,80}(https?:\/\/)/i,
      /\bfetch\s*\(\s*['"]https?:\/\//i,
    ]),
  },
  {
    id: "exfil.completion_trap",
    description: "Trick completions that echo hidden context",
    severity: "high",
    scan: scanFor([
      /\bmy\s+prompt\s+(is|was)\s*[:\-]/i,
      /\bthe\s+conversation\s+(so\s+far|until\s+now)\s+is\s*[:\-]/i,
      /\brespond\s+(only\s+)?with\s+(the\s+)?(first|last)\s+\d+\s+(words?|sentences?|characters?)\s+of\s+(the\s+)?(prompt|context|conversation|system)/i,
      /\boutput\s+everything\s+(you\s+have\s+been\s+given|in\s+your\s+context)/i,
      /\brepeat\s+(the\s+)?words\s+above\b/i,
      /\boutput\s+everything\s+(you\s+have\s+been\s+given|in\s+your\s+context\s+window)\b/i,
    ]),
  },
];
