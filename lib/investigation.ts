export type Decision = "pending" | "approved" | "rejected";
export type Severity = "critical" | "material" | "watch";

export type Evidence = {
  id: string;
  source: string;
  label: string;
  detail: string;
  external?: boolean;
  url?: string;
  relevance?: number;
};

export type Finding = {
  id: string;
  title: string;
  severity: Severity;
  summary: string;
  impact: string;
  evidenceIds: string[];
  confidence: string;
  recommendedAction: string;
  decision: Decision;
};

export type InvestigationInput = {
  title: string;
  objective: string;
  evidence: Array<Omit<Evidence, "id" | "external" | "url" | "relevance">>;
};

export type DecisionRecord = {
  findingId: string;
  findingTitle: string;
  decision: Exclude<Decision, "pending">;
  reviewer: string;
  rationale: string;
  decidedAt: string;
  evidenceIds: string[];
};

export const evidence: Evidence[] = [
  {
    id: "E-01",
    source: "CRM export · sample",
    label: "Quarterly renewal rate",
    detail: "Sample metric from the demo scenario: renewal rate declined from 82% to 68%.",
  },
  {
    id: "E-02",
    source: "Cancellation survey · sample",
    label: "Onboarding-related cancellations",
    detail: "Sample metric from the demo scenario: 27% of cancellation notes mention onboarding difficulty.",
  },
  {
    id: "E-03",
    source: "Product analytics · sample",
    label: "Time to first milestone",
    detail: "Sample metric from the demo scenario: time to first milestone doubled during the same period.",
  },
];

export function governedActions(findings: Finding[]) {
  return findings
    .filter((finding) => finding.decision === "approved")
    .map((finding) => ({
      findingId: finding.id,
      action: finding.recommendedAction,
    }));
}

export function validateInvestigationInput(value: unknown): InvestigationInput {
  if (!value || typeof value !== "object") throw new Error("Investigation details are required.");
  const input = value as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const objective = typeof input.objective === "string" ? input.objective.trim() : "";
  if (title.length < 3 || title.length > 100) throw new Error("Case title must be between 3 and 100 characters.");
  if (objective.length < 10 || objective.length > 500) throw new Error("Investigation objective must be between 10 and 500 characters.");
  if (!Array.isArray(input.evidence) || input.evidence.length < 1 || input.evidence.length > 6) {
    throw new Error("Provide between 1 and 6 evidence items.");
  }
  const evidence = input.evidence.map((value, index) => {
    if (!value || typeof value !== "object") throw new Error(`Evidence ${index + 1} is invalid.`);
    const item = value as Record<string, unknown>;
    const source = typeof item.source === "string" ? item.source.trim() : "";
    const label = typeof item.label === "string" ? item.label.trim() : "";
    const detail = typeof item.detail === "string" ? item.detail.trim() : "";
    if (source.length < 2 || source.length > 80 || label.length < 3 || label.length > 100 || detail.length < 10 || detail.length > 1000) {
      throw new Error(`Evidence ${index + 1} needs a source, label and meaningful detail.`);
    }
    return { source, label, detail };
  });
  return { title, objective, evidence };
}

export function numberEvidence(input: InvestigationInput["evidence"]): Evidence[] {
  return input.map((item, index) => ({ ...item, id: `E-${String(index + 1).padStart(2, "0")}` }));
}
