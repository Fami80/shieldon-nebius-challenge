import assert from "node:assert/strict";
import test from "node:test";
import { buildResearchQuery, researchWithTavily } from "../lib/tavily.ts";

test("Tavily result becomes traceable external evidence", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ results: [{
    title: "Lead response benchmark",
    url: "https://example.com/research",
    content: "Faster responses improve the chance of converting qualified leads.",
    score: 0.92,
  }] }), { status: 200, headers: { "Content-Type": "application/json" } });

  try {
    const result = await researchWithTavily("test-key", "lead response research", 4);
    assert.equal(result[0].id, "E-04");
    assert.equal(result[0].external, true);
    assert.equal(result[0].source, "Tavily · example.com");
    assert.equal(result[0].url, "https://example.com/research");
    assert.equal(result[0].relevance, 0.92);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("research query is derived from the live objective and evidence", () => {
  const query = buildResearchQuery({
    title: "Retention review",
    objective: "Find evidence-backed causes of customer churn",
    evidence: [{ source: "CRM", label: "Renewals", detail: "Renewals declined by 18 percent this quarter." }],
  });
  assert.match(query, /customer churn/);
  assert.match(query, /Renewals declined/);
});
