export type {
  Verdict,
  SourceType,
  RuleMatch,
  Rule,
  Classifier,
  ClassifierResult,
  ScanOptions,
  Thresholds,
  ScanResult,
  Chunk,
  ChunkScanResult,
  ScanChunksOptions,
} from "./types.js";

export { scan, scanSync, runRules, scoreMatches } from "./core/scanner.js";
export {
  redactSpans,
  mergeSpans,
  type RedactionResult,
} from "./core/redact.js";
export {
  defaultRules,
} from "./rules/index.js";
export { overrideRules } from "./rules/override.js";
export { roleSpoofRules } from "./rules/roleSpoof.js";
export { exfiltrationRules } from "./rules/exfiltration.js";
export { encodingRules } from "./rules/encoding.js";
export {
  buildClassifierPrompt,
  parseClassifierResponse,
  classificationToVerdict,
} from "./llm/classifier.js";
export { createOpenAIClassifier } from "./llm/adapter.js";
export { scanChunks } from "./rag/chunkScan.js";
export {
  frameDocument,
  frameDocuments,
  type FramedDocument,
} from "./rag/frame.js";
export {
  defaultThresholds,
  resolveThresholds,
  combineVerdicts,
  uncertaintyBand,
  verdictFromScore,
} from "./core/policy.js";
