/**
 * Encoded-payload and obfuscation detection: base64/hex blobs that may hide
 * injection text, plus invisible-character tricks.
 */
import type { Rule } from "../types.js";

const SUSPICIOUS_DECODED = [
  /\bignore\b/i,
  /\bdisregard\b/i,
  /\bsystem\s*prompt\b/i,
  /\bexfiltrat/i,
  /\bcurl\b/i,
  /\bhttps?:\/\//i,
  /\bexecute\b/i,
  /\bshell\b/i,
  /\bpassword\b/i,
  /\bapi[_ -]?key\b/i,
  /\breveal\b/i,
];

function isSuspiciousDecoded(s: string): boolean {
  return SUSPICIOUS_DECODED.some((re) => re.test(s));
}

function decodeBase64(blob: string): string | null {
  try {
    const decoded = Buffer.from(blob, "base64").toString("utf8");
    // Reject decodes with replacement chars (blob wasn't real base64 text).
    if (decoded.includes("\uFFFD")) return null;
    return decoded;
  } catch {
    return null;
  }
}

function decodeHex(hex: string): string | null {
  if (hex.length % 2 !== 0) return null;
  try {
    const decoded = Buffer.from(hex, "hex").toString("utf8");
    if (decoded.includes("\uFFFD")) return null;
    return decoded;
  } catch {
    return null;
  }
}

export const encodingRules: Rule[] = [
  {
    id: "encoding.escape_sequences",
    description: "Backslash escape sequences (\\xNN/\\uNNNN) hiding suspicious text",
    severity: "high",
    scan: (text) => {
      const hits: Array<{ start: number; end: number; text: string }> = [];
      const re = /(?:\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}){4,}/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const blob = m[0];
        if (!blob) continue;
        const decoded = blob.replace(
          /\\x([0-9a-fA-F]{2})|\\u([0-9a-fA-F]{4})/g,
          (_, hex, uni) =>
            String.fromCharCode(
              parseInt(hex ?? uni, 16),
            ),
        );
        if (isSuspiciousDecoded(decoded)) {
          hits.push({ start: m.index, end: m.index + blob.length, text: blob });
        }
      }
      return hits;
    },
  },
  {
    id: "encoding.base64_blob",
    description: "Base64 blob that decodes to suspicious content",
    severity: "high",
    scan: (text) => {
      const hits: Array<{ start: number; end: number; text: string }> = [];
      const re = /[A-Za-z0-9+/]{24,}={0,2}/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const blob = m[0];
        if (!blob) continue;
        const decoded = decodeBase64(blob);
        if (decoded && isSuspiciousDecoded(decoded)) {
          hits.push({ start: m.index, end: m.index + blob.length, text: blob });
        }
      }
      return hits;
    },
  },
  {
    id: "encoding.hex_blob",
    description: "Hex blob that decodes to suspicious content",
    severity: "high",
    scan: (text) => {
      const hits: Array<{ start: number; end: number; text: string }> = [];
      const re = /(?:[0-9a-fA-F]{2}){16,}/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const blob = m[0];
        if (!blob) continue;
        const decoded = decodeHex(blob);
        if (decoded && isSuspiciousDecoded(decoded)) {
          hits.push({ start: m.index, end: m.index + blob.length, text: blob });
        }
      }
      return hits;
    },
  },
  {
    id: "encoding.zero_width",
    description: "Zero-width / invisible characters used to hide text",
    severity: "medium",
    scan: (text) => {
      const hits: Array<{ start: number; end: number; text: string }> = [];
      const re = /[\u200B\u200C\u200D\u2060\uFEFF]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        hits.push({ start: m.index, end: m.index + 1, text: m[0] });
      }
      return hits;
    },
  },
];
