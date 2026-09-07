import { NextResponse } from "next/server";
import OpenAI from "openai";
import { llm } from "@/lib/assess";
import { llmConfigError } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** One cheap round trip, so a bad key or model is caught here and not mid-essay. */
export async function POST() {
  const configError = llmConfigError();
  if (configError) return NextResponse.json({ ok: false, error: configError }, { status: 400 });

  const { baseURL, apiKey, model } = llm();
  const started = Date.now();
  try {
    const res = await new OpenAI({ baseURL, apiKey }).chat.completions.create({
      model,
      max_tokens: 5,
      messages: [{ role: "user", content: "Reply with the single word: ready" }],
    });
    return NextResponse.json({
      ok: true,
      model,
      endpoint: baseURL,
      ms: Date.now() - started,
      reply: res.choices[0]?.message?.content?.trim().slice(0, 40) ?? "",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err), endpoint: baseURL, model },
      { status: 502 },
    );
  }
}
