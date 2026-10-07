import assert from "node:assert/strict";
import test from "node:test";
import { researchWithTavily } from "../lib/tavily.ts";

test("Tavily result becomes traceable external evidence", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ results: [{
    title: "Lead response benchmark",
    url: "https://example.com/research",
    content: "Faster responses improve the chance of converting qualified leads.",
    score: 0.92,
  }] }), { status: 200, headers: { "Content-Type": "application/json" } });

  try {
    const result = await researchWithTavily("test-key");
    assert.equal(result.id, "E-04");
    assert.equal(result.external, true);
    assert.equal(result.source, "Tavily · example.com");
    assert.equal(result.url, "https://example.com/research");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
