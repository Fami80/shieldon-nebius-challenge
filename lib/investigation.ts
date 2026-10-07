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
    source: "CRM export",
    label: "Lead response time",
    detail: "38% of qualified enquiries waited more than 24 hours for a first response.",
  },
  {
    id: "E-02",
    source: "Booking data",
    label: "Consultation leakage",
    detail: "31 high-intent consultations were marked no-show with no recorded recovery attempt.",
  },
  {
    id: "E-03",
    source: "Website review",
    label: "Unclear next step",
    detail: "High-value treatment pages present multiple competing calls to action.",
  },
  {
    id: "E-04",
    source: "Tavily · external",
    label: "Response-speed benchmark",
    detail: "Independent research indicates conversion probability falls as lead response time increases.",
    external: true,
  },
];

export const initialFindings: Finding[] = [
  {
    id: "F-01",
    title: "High-intent leads are cooling before contact",
    severity: "critical",
    summary: "Slow first response and unowned follow-up create a measurable break between demand and booking.",
    impact: "AED 46k–71k monthly revenue at risk",
    evidenceIds: ["E-01", "E-04"],
    confidence: "High evidence alignment",
    recommendedAction: "Install a 15-minute qualified-lead response SLA with named ownership and daily exception review.",
    decision: "pending",
  },
  {
    id: "F-02",
    title: "No-show recovery is not operating as a system",
    severity: "material",
    summary: "The current workflow records missed consultations but shows no consistent recovery ownership.",
    impact: "31 recoverable conversations identified",
    evidenceIds: ["E-02"],
    confidence: "Direct operational evidence",
    recommendedAction: "Launch a two-step no-show recovery sequence with same-day ownership and weekly outcome tracking.",
    decision: "pending",
  },
  {
    id: "F-03",
    title: "Website choice density may suppress action",
    severity: "watch",
    summary: "Competing calls to action may add friction, but conversion data is required before intervention.",
    impact: "Impact not yet quantified",
    evidenceIds: ["E-03"],
    confidence: "Missing conversion evidence",
    recommendedAction: "Run a controlled single-CTA test before changing the full journey.",
    decision: "pending",
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
