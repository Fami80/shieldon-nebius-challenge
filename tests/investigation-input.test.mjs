import assert from "node:assert/strict";
import test from "node:test";
import { numberEvidence, validateInvestigationInput } from "../lib/investigation.ts";

const valid = {
  title: "Customer retention review",
  objective: "Identify evidence-backed causes of customer churn.",
  evidence: [{ source: "CRM export", label: "Renewal rate", detail: "Renewal rate declined by 18 percent this quarter." }],
};

test("valid custom investigation input is normalized and numbered", () => {
  const input = validateInvestigationInput(valid);
  assert.equal(input.title, valid.title);
  assert.equal(numberEvidence(input.evidence)[0].id, "E-01");
});

test("empty or excessive evidence is rejected", () => {
  assert.throws(() => validateInvestigationInput({ ...valid, evidence: [] }), /between 1 and 6/);
  assert.throws(() => validateInvestigationInput({ ...valid, evidence: Array(7).fill(valid.evidence[0]) }), /between 1 and 6/);
});

test("short placeholder evidence is rejected", () => {
  assert.throws(() => validateInvestigationInput({ ...valid, evidence: [{ source: "x", label: "x", detail: "short" }] }), /meaningful detail/);
});
