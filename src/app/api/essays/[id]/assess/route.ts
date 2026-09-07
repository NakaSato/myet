import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessEssay, llmConfigError, overallBand } from "@/lib/assess";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type EssayRow = {
  id: number;
  body: string;
  word_count: number;
  prompt_text: string | null;
};

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const essay = db
    .prepare(
      `SELECT e.id, e.body, e.word_count, p.text AS prompt_text
       FROM essays e LEFT JOIN prompts p ON p.id = e.prompt_id
       WHERE e.id = ?`,
    )
    .get(id) as EssayRow | undefined;

  if (!essay) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const configError = llmConfigError();
  if (configError) return NextResponse.json({ error: configError }, { status: 503 });

  let assessment, usage, model;
  try {
    ({ assessment, usage, model } = await assessEssay({
      promptText: essay.prompt_text ?? "(no prompt recorded)",
      body: essay.body,
      wordCount: essay.word_count,
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assessment failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const overall = overallBand(assessment);

  const saved = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO assessments
           (essay_id, band_tr, band_cc, band_lr, band_gra, band_overall, feedback_json, model_used)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        essay.id,
        assessment.task_response.band,
        assessment.coherence_cohesion.band,
        assessment.lexical_resource.band,
        assessment.grammatical_range.band,
        overall,
        JSON.stringify(assessment),
        model,
      );

    const assessmentId = info.lastInsertRowid;
    const insertError = db.prepare(
      "INSERT INTO errors (assessment_id, category, original, corrected, note) VALUES (?, ?, ?, ?, ?)",
    );
    for (const c of assessment.corrections) {
      insertError.run(assessmentId, c.category, c.original, c.corrected, c.why);
    }
    return assessmentId;
  })();

  return NextResponse.json({
    assessment_id: saved,
    band_overall: overall,
    feedback: assessment,
    usage: { input: usage?.prompt_tokens, output: usage?.completion_tokens },
  });
}
