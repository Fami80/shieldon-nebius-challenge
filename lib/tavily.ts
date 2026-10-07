import type { Evidence, InvestigationInput } from "./investigation";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

function isPublicWebUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function buildResearchQuery(input: InvestigationInput) {
  const signals = input.evidence
    .slice(0, 3)
    .map((item) => `${item.label}: ${item.detail}`)
    .join(" ")
    .slice(0, 420);
  return `${input.objective} ${signals} independent benchmark research`.replace(/\s+/g, " ").trim();
}

export async function researchWithTavily(
  apiKey: string,
  query: string,
  firstExternalIndex: number,
): Promise<Evidence[]> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Project-ID": "shieldon-nebius-challenge",
    },
    body: JSON.stringify({
      query,
      search_depth: "advanced",
      max_results: 5,
      include_answer: false,
      include_raw_content: false,
      safe_search: true,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Tavily request failed (${response.status}): ${message.slice(0, 240)}`);
  }

  const payload = (await response.json()) as { results?: TavilyResult[] };
  const usable = (payload.results ?? [])
    .filter((item): item is TavilyResult & { title: string; url: string; content: string } => Boolean(item.title && item.url && item.content && isPublicWebUrl(item.url)))
    .filter((item, index, items) => items.findIndex((candidate) => candidate.url === item.url) === index)
    .slice(0, 3);
  if (!usable.length) throw new Error("Tavily returned no usable external evidence.");

  return usable.map((result, index) => {
    const hostname = new URL(result.url).hostname.replace(/^www\./, "");
    return {
      id: `E-${String(firstExternalIndex + index).padStart(2, "0")}`,
      source: `Tavily · ${hostname}`,
      label: result.title.slice(0, 100),
      detail: result.content.replace(/\s+/g, " ").trim().slice(0, 420),
      external: true,
      url: result.url,
      relevance: typeof result.score === "number" ? result.score : undefined,
    };
  });
}
