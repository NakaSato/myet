import { NextRequest, NextResponse } from "next/server";
import { llmConfigError, publicSettings, saveSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ settings: publicSettings(), error: llmConfigError() });
}

export async function PUT(req: NextRequest) {
  const patch = await req.json();
  // An empty key field means "leave it alone", not "clear it" — the browser
  // never receives the stored key, so it can't send it back.
  if (patch.llm_api_key === "") delete patch.llm_api_key;
  saveSettings(patch);
  return NextResponse.json({ settings: publicSettings(), error: llmConfigError() });
}

export async function DELETE() {
  saveSettings({ llm_api_key: "" });
  return NextResponse.json({ settings: publicSettings(), error: llmConfigError() });
}
