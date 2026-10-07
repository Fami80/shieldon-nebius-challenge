import { NextResponse } from "next/server";
import { runInvestigation } from "../../../lib/run-investigation";

export async function POST(request: Request) {
  const apiKey = process.env.NEBIUS_API_KEY;
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NEBIUS_API_KEY is not configured. Add it to .env.local and restart the app." }, { status: 503 });
  }
  if (!tavilyApiKey) {
    return NextResponse.json({ error: "TAVILY_API_KEY is not configured. Add it to .env.local and restart the app." }, { status: 503 });
  }

  try {
    return NextResponse.json(await runInvestigation(await request.json(), apiKey, tavilyApiKey));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nebius analysis failed.";
    const isInputError = /required|must|provide|needs|invalid/i.test(message);
    return NextResponse.json({ error: message }, { status: isInputError ? 400 : 502 });
  }
}
