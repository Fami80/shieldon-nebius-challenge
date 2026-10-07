import { numberEvidence, validateInvestigationInput } from "./investigation.ts";
import { investigateWithNebius } from "./nebius.ts";
import { buildResearchQuery, researchWithTavily } from "./tavily.ts";

export async function runInvestigation(value: unknown, nebiusApiKey: string, tavilyApiKey: string) {
  const input = validateInvestigationInput(value);
  const internalEvidence = numberEvidence(input.evidence);
  const researchQuery = buildResearchQuery(input);
  const externalEvidence = await researchWithTavily(tavilyApiKey, researchQuery, internalEvidence.length + 1);
  const evidence = [...internalEvidence, ...externalEvidence];
  const analysis = await investigateWithNebius(nebiusApiKey, input, evidence);
  return {
    ...analysis,
    caseTitle: input.title,
    evidence,
    researchQuery,
    groundedBy: "Tavily" as const,
  };
}
