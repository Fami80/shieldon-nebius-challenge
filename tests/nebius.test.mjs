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

test("reasoning text, fenced JSON, optional IDs and snake-case evidence are normalized", () => {
  const findings = parseFindings(`Reasoning complete.\n\`\`\`json
    {"candidate_findings":[{"title":"No-show leakage","severity":"MATERIAL","summary":"Recovery is missing.","impact":"31 conversations","evidence_ids":["E-02"],"confidence":"High"}]}
  \`\`\``);
  assert.equal(findings[0].id, "F-01");
  assert.equal(findings[0].severity, "material");
  assert.equal(findings[0].decision, "pending");
  assert.deepEqual(findings[0].evidenceIds, ["E-02"]);
});
