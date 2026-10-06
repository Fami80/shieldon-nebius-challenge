import assert from "node:assert/strict";
import test from "node:test";
import { governedActions } from "../lib/investigation.ts";

const baseFinding = {
  id: "F-01",
  title: "Test finding",
  severity: "critical",
  summary: "Test summary",
  impact: "Test impact",
  evidenceIds: ["E-01"],
  confidence: "Test confidence",
};

test("pending candidate findings never produce governed actions", () => {
  assert.equal(governedActions([{ ...baseFinding, decision: "pending" }]).length, 0);
});

test("rejected candidate findings never produce governed actions", () => {
  assert.equal(governedActions([{ ...baseFinding, decision: "rejected" }]).length, 0);
});

test("only explicitly approved findings produce governed actions", () => {
  const result = governedActions([
    { ...baseFinding, decision: "approved" },
    { ...baseFinding, id: "F-02", decision: "pending" },
  ]);
  assert.deepEqual(result.map((action) => action.findingId), ["F-01"]);
});
