/**
 * OpenAI-compatible chat-completions adapter. Uses only fetch (Node >= 18).
 */
import type { Classifier, ClassifierResult, SourceType } from "../types.js";
import {
  buildClassifierPrompt,
  classificationToVerdict,
  parseClassifierResponse,
} from "./classifier.js";

export interface OpenAICompatibleOptions {
  /** e.g. "https://api.openai.com/v1" (no trailing slash). */
  baseUrl: string;
  apiKey: string;
  model: string;
  /** Sampling temperature; default 0. */
  temperature?: number;
  fetchImpl?: typeof fetch;
}

export function createOpenAIClassifier(
  options: OpenAICompatibleOptions,
): Classifier {
  const doFetch = options.fetchImpl ?? fetch;
  return async (text, context): Promise<ClassifierResult> => {
    const prompt = buildClassifierPrompt(text, context.source as SourceType);
    const res = await doFetch(`${options.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        temperature: options.temperature ?? 0,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      throw new Error(
        `classifier request failed: ${res.status} ${res.statusText}`,
      );
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = parseClassifierResponse(content);
    return {
      verdict: classificationToVerdict(parsed.classification),
      reason: parsed.reason,
    };
  };
}
