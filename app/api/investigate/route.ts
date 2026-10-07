import { NextResponse } from "next/server";
import { investigateWithNebius } from "../../../lib/nebius";
import { evidence } from "../../../lib/investigation";
import { researchWithTavily } from "../../../lib/tavily";

export async function POST() {
  const apiKey = process.env.NEBIUS_API_KEY;
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NEBIUS_API_KEY is not configured. Add it to .env.local and restart the app." }, { status: 503 });
  }
  if (!tavilyApiKey) {
    return NextResponse.json({ error: "TAVILY_API_KEY is not configured. Add it to .env.local and restart the app." }, { status: 503 });
  }

  try {
    const externalEvidence = await researchWithTavily(tavilyApiKey);
    const analysis = await investigateWithNebius(apiKey, externalEvidence);
    return NextResponse.json({
      ...analysis,
      evidence: evidence.map((item) => item.id === externalEvidence.id ? externalEvidence : item),
      groundedBy: "Tavily",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nebius analysis failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
