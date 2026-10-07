import type { Evidence } from "./investigation";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

export async function researchWithTavily(apiKey: string): Promise<Evidence> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Project-ID": "shieldon-nebius-challenge",
    },
    body: JSON.stringify({
      query: "lead response time effect on sales conversion qualified leads research",
      search_depth: "basic",
      max_results: 3,
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
  const result = payload.results?.find((item) => item.title && item.url && item.content);
  if (!result?.title || !result.url || !result.content) {
    throw new Error("Tavily returned no usable external evidence.");
  }

  const hostname = new URL(result.url).hostname.replace(/^www\./, "");
  return {
    id: "E-04",
    source: `Tavily · ${hostname}`,
    label: result.title.slice(0, 100),
    detail: result.content.replace(/\s+/g, " ").trim().slice(0, 320),
    external: true,
    url: result.url,
  };
}

