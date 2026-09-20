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
 * Fake role/system markers embedded in untrusted content, attempting to
 * impersonate privileged conversation structure (system messages, chat
 * templates, instruction delimiters).
 */
export const roleSpoofRules: Rule[] = [
  {
    id: "rolespoof.system_tag",
    description: "Fake <system> / system-prompt role tags in content",
    severity: "critical",
    scan: scanFor([
      /<\s*(\|?im_start\|?)?\s*system\s*\|?>/i,
      /<\|(im_start|im_end|endoftext)\|>/i,
      /<\|start_header_id\|>system<\|end_header_id\|>/i,
      /\[?(INST|SYS)\]?\s*[:\-]/i,
      /\[(\/?)INST\]/i,
      /#{2,}\s*system\s*#{0,}\s*[:\-]?/i,
      /\bsystem\s+prompt\s*(starts|begins)\s+(here|below|now)\b/i,
    ]),
  },
  {
    id: "rolespoof.chatml_delimiters",
    description: "Chat template delimiters used to fake conversation turns",
    severity: "high",
    scan: scanFor([
      /<\|(im_start|im_end)\|>\s*(system|assistant)/i,
      /<\|assistant\|>/i,
      /\bUSER\s*:\s*[\s\S]{0,200}?\bASSISTANT\s*:/i,
      /^\s*(Human|Assistant)\s*:\s*/im,
      /<\|(begin|end)_of_(text|turn|sentence)\|>/i,
    ]),
  },
  {
    id: "rolespoof.function_marker",
    description: "Fake tool/function-call markers to trigger privileged paths",
    severity: "high",
    scan: scanFor([
      /<\|reserved_token_\d+\|>/i,
      /\btool_call\b\s*[:=]/i,
      /\bfunction_call\b\s*[:=]/i,
      /<\s*(tool|function)_result\s*>/i,
      /\bSYSTEM:\s*/i,
    ]),
  },
];
