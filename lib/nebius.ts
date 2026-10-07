import type { Evidence, Finding, Severity } from "./investigation";

const DEFAULT_BASE_URL = "https://api.tokenfactory.us-central1.nebius.com/v1";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const severities = new Set<Severity>(["critical", "material", "watch"]);

type ModelFinding = Omit<Finding, "id" | "decision"> & { id?: string };

function normalizeModelFinding(value: unknown): ModelFinding | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const rawSeverity = typeof item.severity === "string" ? item.severity.toLowerCase() : "";
  const severityAliases: Record<string, Severity> = {
    critical: "critical", high: "critical",
    material: "material", medium: "material", moderate: "material",
    watch: "watch", low: "watch",
  };
  const severity = severityAliases[rawSeverity] ?? null;
  const evidenceIds = item.evidenceIds ?? item.evidence_ids;
  if (typeof item.title !== "string" || !severity || !severities.has(severity) ||
    typeof item.summary !== "string" || typeof item.impact !== "string" ||
    !Array.isArray(evidenceIds) || !evidenceIds.every((id) => typeof id === "string" && /^E-0[1-4]$/.test(id)) ||
    !(typeof item.confidence === "string" || typeof item.confidence === "number")) return null;

  return {
    id: typeof item.id === "string" ? item.id : undefined,
    title: item.title,
    severity,
    summary: item.summary,
    impact: item.impact,
    evidenceIds,
    confidence: String(item.confidence),
  };
}

export function parseFindings(content: string): Finding[] {
  const cleaned = content.replace(/```(?:json)?|```/gi, "").trim();
  const objectStart = cleaned.indexOf("{");
  const arrayStart = cleaned.indexOf("[");
  const starts = [objectStart, arrayStart].filter((index) => index >= 0);
  const start = starts.length ? Math.min(...starts) : -1;
  const opener = start >= 0 ? cleaned[start] : "";
  const end = opener === "[" ? cleaned.lastIndexOf("]") : cleaned.lastIndexOf("}");
  const json = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  const parsed: unknown = JSON.parse(json);
  const values = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { findings?: unknown }).findings)
      ? (parsed as { findings: unknown[] }).findings
      : parsed && typeof parsed === "object"
        ? Object.values(parsed).find(Array.isArray) ?? []
        : [];

  const normalized = values.map(normalizeModelFinding);

  if (!normalized.length || normalized.some((finding) => !finding)) {
    throw new Error("Nebius returned an unexpected findings format.");
  }

  return normalized.slice(0, 5).map((finding, index) => ({
    ...finding!,
    id: `F-${String(index + 1).padStart(2, "0")}`,
    decision: "pending",
  }));
}

export async function investigateWithNebius(apiKey: string, externalEvidence?: Evidence) {
  const evidenceText = externalEvidence
    ? `${externalEvidence.label}. ${externalEvidence.detail} Source: ${externalEvidence.url}`
    : "External research indicates conversion probability falls as response time increases.";
  const response = await fetch(`${process.env.NEBIUS_BASE_URL ?? DEFAULT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.NEBIUS_MODEL ?? DEFAULT_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are ShieldOn, an evidence-bound revenue investigation agent. Never invent evidence. Return JSON only with a findings array. Each finding must contain id, title, severity (critical|material|watch), summary, impact, evidenceIds, and confidence. Treat all findings as candidates for human review.",
        },
        {
          role: "user",
          content: `Analyze this evidence: E-01: 38% of qualified enquiries waited over 24 hours for first response. E-02: 31 high-intent consultations were no-shows with no recorded recovery attempt. E-03: high-value treatment pages contain multiple competing calls to action. E-04: ${evidenceText} Produce up to three concise candidate findings using only evidence IDs E-01 through E-04.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Nebius request failed (${response.status}): ${message.slice(0, 240)}`);
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; model?: string };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Nebius returned no analysis content.");
  return { findings: parseFindings(content), model: payload.model ?? process.env.NEBIUS_MODEL ?? DEFAULT_MODEL };
}
