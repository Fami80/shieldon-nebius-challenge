import type { Finding, Severity } from "./investigation";

const DEFAULT_BASE_URL = "https://api.tokenfactory.us-central1.nebius.com/v1";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const severities = new Set<Severity>(["critical", "material", "watch"]);

type ModelFinding = Omit<Finding, "decision">;

function isModelFinding(value: unknown): value is ModelFinding {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.title === "string" &&
    typeof item.severity === "string" && severities.has(item.severity as Severity) &&
    typeof item.summary === "string" && typeof item.impact === "string" &&
    Array.isArray(item.evidenceIds) && item.evidenceIds.every((id) => typeof id === "string") &&
    typeof item.confidence === "string";
}

export function parseFindings(content: string): Finding[] {
  const parsed: unknown = JSON.parse(content);
  const values = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { findings?: unknown }).findings)
      ? (parsed as { findings: unknown[] }).findings
      : [];

  if (!values.length || !values.every(isModelFinding)) {
    throw new Error("Nebius returned an unexpected findings format.");
  }

  return values.slice(0, 5).map((finding, index) => ({
    ...finding,
    id: `F-${String(index + 1).padStart(2, "0")}`,
    decision: "pending",
  }));
}

export async function investigateWithNebius(apiKey: string) {
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
          content: "Analyze this evidence: E-01: 38% of qualified enquiries waited over 24 hours for first response. E-02: 31 high-intent consultations were no-shows with no recorded recovery attempt. E-03: high-value treatment pages contain multiple competing calls to action. E-04: external research indicates conversion probability falls as response time increases. Produce up to three concise candidate findings using only evidence IDs E-01 through E-04.",
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

