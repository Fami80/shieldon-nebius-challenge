import assert from "node:assert/strict";
import test from "node:test";
import { runInvestigation } from "../lib/run-investigation.ts";

test("custom case flows through Tavily and Nemotron into pending cited findings", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) });
    if (String(url).includes("tavily.com")) {
      return new Response(JSON.stringify({ results: [
        { title: "Retention benchmark", url: "https://example.com/retention", content: "Clear onboarding improves subscription retention.", score: 0.91 },
        { title: "Churn research", url: "https://example.org/churn", content: "Early product friction is associated with customer churn.", score: 0.84 },
      ] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      model: "nvidia/nemotron-test",
      choices: [{ message: { content: JSON.stringify({ findings: [{
        title: "Onboarding friction is linked to cancellation evidence",
        severity: "material",
        summary: "Cancellation notes and external research point to onboarding friction.",
        impact: "Renewal recovery opportunity requires validation.",
        evidenceIds: ["E-02", "E-04"],
        confidence: "High",
        recommendedAction: "Assign an onboarding owner and run a two-week assisted onboarding test.",
      }] }) } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    const payload = await runInvestigation({
        title: "Subscription retention review",
        objective: "Identify evidence-backed causes of customer churn and safe next actions.",
        evidence: [
          { source: "CRM export", label: "Renewal decline", detail: "Quarterly renewal rate declined from 82 percent to 68 percent." },
          { source: "Support log", label: "Onboarding complaints", detail: "Twenty seven percent of cancellation notes mention onboarding difficulty." },
        ],
      }, "nebius-test", "tavily-test");
    assert.equal(calls.length, 2);
    assert.match(calls[0].body.query, /customer churn/);
    assert.equal(payload.evidence.length, 4);
    assert.equal(payload.evidence[2].id, "E-03");
    assert.equal(payload.findings[0].decision, "pending");
    assert.deepEqual(payload.findings[0].evidenceIds, ["E-02", "E-04"]);
    assert.equal(payload.groundedBy, "Tavily");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
