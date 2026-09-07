import { NextResponse } from "next/server";
import { CALIBRATION_SET } from "@/lib/calibration";
import { LLM, assessEssay, countWords, llmConfigError, overallBand } from "@/lib/assess";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

/**
 * Marks the official IELTS sample responses and reports the gap against the
 * bands real examiners awarded them. Writes nothing to the database.
 */
export async function POST() {
  const configError = llmConfigError();
  if (configError) return NextResponse.json({ error: configError }, { status: 503 });

  const results = [];

  for (const c of CALIBRATION_SET) {
    try {
      const { assessment } = await assessEssay({
        promptText: c.prompt,
        body: c.body,
        wordCount: countWords(c.body),
      });
      const tool = overallBand(assessment);
      results.push({
        id: c.id,
        official: c.officialBand,
        tool,
        delta: Number((tool - c.officialBand).toFixed(1)),
        criteria: {
          task_response: assessment.task_response.band,
          coherence_cohesion: assessment.coherence_cohesion.band,
          lexical_resource: assessment.lexical_resource.band,
          grammatical_range: assessment.grammatical_range.band,
        },
        top_priority: assessment.top_priority,
      });
    } catch (err) {
      results.push({
        id: c.id,
        official: c.officialBand,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const scored = results.filter((r) => typeof r.delta === "number") as {
    delta: number;
  }[];
  const meanDelta = scored.length
    ? Number((scored.reduce((s, r) => s + r.delta, 0) / scored.length).toFixed(2))
    : null;

  return NextResponse.json({
    model: LLM.model,
    endpoint: LLM.baseURL,
    results,
    mean_delta: meanDelta,
    verdict:
      meanDelta === null
        ? "no result"
        : meanDelta >= 1
          ? "inflating badly — do not trust the band, use the corrections only"
          : meanDelta >= 0.5
            ? "inflating — subtract roughly this much from every band it gives you"
            : meanDelta <= -0.5
              ? "marking harsher than a real examiner"
              : "close enough to a real examiner to be useful as a compass",
  });
}
