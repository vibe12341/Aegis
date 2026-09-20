import type { Rule } from "../types.js";
import { overrideRules } from "./override.js";
import { roleSpoofRules } from "./roleSpoof.js";
import { exfiltrationRules } from "./exfiltration.js";
import { encodingRules } from "./encoding.js";

/** All built-in detection rules in evaluation order. */
export const defaultRules: Rule[] = [
  ...overrideRules,
  ...roleSpoofRules,
  ...exfiltrationRules,
  ...encodingRules,
];
