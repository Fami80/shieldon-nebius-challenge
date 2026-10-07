export type Decision = "pending" | "approved" | "rejected";
export type Severity = "critical" | "material" | "watch";

export type Evidence = {
  id: string;
  source: string;
  label: string;
  detail: string;
  external?: boolean;
  url?: string;
};

export type Finding = {
  id: string;
  title: string;
  severity: Severity;
  summary: string;
  impact: string;
  evidenceIds: string[];
  confidence: string;
  decision: Decision;
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
    decision: "pending",
  },
];

export function governedActions(findings: Finding[]) {
  return findings
    .filter((finding) => finding.decision === "approved")
    .map((finding) => ({
      findingId: finding.id,
      action:
        finding.id === "F-01"
          ? "Install a 15-minute qualified-lead response SLA with named ownership and daily exception review."
          : finding.id === "F-02"
            ? "Launch a two-step no-show recovery sequence with same-day ownership and weekly outcome tracking."
            : "Run a controlled single-CTA test before changing the full journey.",
    }));
}
