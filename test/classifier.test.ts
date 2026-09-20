import { describe, expect, it, vi } from "vitest";
import {
  buildClassifierPrompt,
  parseClassifierResponse,
  classificationToVerdict,
} from "../src/llm/classifier.js";
import { createOpenAIClassifier } from "../src/llm/adapter.js";

describe("buildClassifierPrompt", () => {
  it("frames untrusted text with quotes and instructs JSON output", () => {
    const p = buildClassifierPrompt("some text", "retrieved");
    expect(p).toContain("security classifier");
    expect(p).toContain('"""');
    expect(p).toContain("retrieved document");
  });

  it("neutralizes embedded triple quotes", () => {
    const p = buildClassifierPrompt('say """hi""" now', "user");
    expect(p).not.toContain('"""hi"""');
  });
});

describe("parseClassifierResponse", () => {
  it("parses strict JSON", () => {
    const r = parseClassifierResponse(
      '{"classification":"malicious","reason":"tries to leak system prompt"}',
    );
    expect(r.classification).toBe("malicious");
    expect(r.reason).toContain("leak");
  });

  it("tolerates surrounding prose", () => {
    const r = parseClassifierResponse('Sure! {"classification":"benign"} hope that helps');
    expect(r.classification).toBe("benign");
  });

  it("rejects invalid classification values", () => {
    expect(() =>
      parseClassifierResponse('{"classification":"maybe"}'),
    ).toThrow();
  });

  it("rejects non-JSON", () => {
    expect(() => parseClassifierResponse("no json here")).toThrow();
  });
});

describe("classificationToVerdict", () => {
  it("maps classifications to verdicts", () => {
    expect(classificationToVerdict("benign")).toBe("allow");
    expect(classificationToVerdict("suspicious")).toBe("flag");
    expect(classificationToVerdict("malicious")).toBe("block");
  });
});

describe("createOpenAIClassifier", () => {
  it("calls chat completions and parses response", async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: '{"classification":"malicious","reason":"x"}' } },
          ],
        }),
        { status: 200 },
      ),
    );
    const classifier = createOpenAIClassifier({
      baseUrl: "https://api.example.com/v1",
      apiKey: "test-key",
      model: "gpt-test",
      fetchImpl,
    });
    const r = await classifier("injection text", { source: "retrieved" });
    expect(r.verdict).toBe("block");
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe("https://api.example.com/v1/chat/completions");
    expect((init as RequestInit).headers).toMatchObject({
      authorization: "Bearer test-key",
    });
  });

  it("throws on HTTP errors", async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      new Response("nope", { status: 500 }),
    );
    const classifier = createOpenAIClassifier({
      baseUrl: "https://api.example.com/v1",
      apiKey: "k",
      model: "m",
      fetchImpl,
    });
    await expect(classifier("t", { source: "retrieved" })).rejects.toThrow(
      /500/,
    );
  });
});
