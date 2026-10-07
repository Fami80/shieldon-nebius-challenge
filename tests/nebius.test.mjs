import assert from "node:assert/strict";
import test from "node:test";
import { parseFindings } from "../lib/nebius.ts";

test("Nebius findings are always normalized to pending", () => {
  const findings = parseFindings(JSON.stringify({ findings: [{
    id: "anything", title: "Lead delay", severity: "critical",
    summary: "Qualified leads wait too long.", impact: "Revenue at risk",
    evidenceIds: ["E-01"], confidence: "High", decision: "approved",
  }] }));
  assert.equal(findings[0].id, "F-01");
  assert.equal(findings[0].decision, "pending");
});

test("invalid model output is rejected", () => {
  assert.throws(() => parseFindings('{"findings":[{"title":"Incomplete"}]}'));
});
