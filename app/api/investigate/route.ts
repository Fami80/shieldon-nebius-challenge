import { NextResponse } from "next/server";
import { consumeRateLimit } from "../../../lib/rate-limit";
import { runInvestigation } from "../../../lib/run-investigation";

const MAX_BODY_BYTES = 24 * 1024;

export async function POST(request: Request) {
  const apiKey = process.env.NEBIUS_API_KEY;
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NEBIUS_API_KEY is not configured. Add it to .env.local and restart the app." }, { status: 503 });
  }
  if (!tavilyApiKey) {
    return NextResponse.json({ error: "TAVILY_API_KEY is not configured. Add it to .env.local and restart the app." }, { status: 503 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large. Keep the case and evidence under 24 KB." }, { status: 413 });
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large. Keep the case and evidence under 24 KB." }, { status: 413 });
  }

  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedAddresses = forwardedFor?.split(",");
  const clientIp = request.headers.get("x-real-ip")
    ?? forwardedAddresses?.[forwardedAddresses.length - 1]?.trim()
    ?? "unknown";
  const limit = consumeRateLimit(clientIp, 3, 60_000);
  if (!limit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many investigations from this address. Wait a minute before trying again." },
      { status: 429, headers: { "Retry-After": String(retryAfter), "X-RateLimit-Remaining": "0" } },
    );
  }

  try {
    const result = await runInvestigation(input, apiKey, tavilyApiKey);
    return NextResponse.json(result, { headers: { "X-RateLimit-Remaining": String(limit.remaining) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nebius analysis failed.";
    const isInputError = /required|must|provide|needs|invalid/i.test(message);
    return NextResponse.json({ error: message }, { status: isInputError ? 400 : 502 });
  }
}
