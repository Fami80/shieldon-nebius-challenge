import { NextResponse } from "next/server";
import { investigateWithNebius } from "../../../lib/nebius";

export async function POST() {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NEBIUS_API_KEY is not configured. Add it to .env.local and restart the app." }, { status: 503 });
  }

  try {
    return NextResponse.json(await investigateWithNebius(apiKey));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nebius analysis failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

