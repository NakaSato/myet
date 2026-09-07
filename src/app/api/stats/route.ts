import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LLM, llmConfigError } from "@/lib/assess";

export const dynamic = "force-dynamic";

const LATEST_ASSESSMENT = `(SELECT id FROM assessments WHERE essay_id = e.id ORDER BY id DESC LIMIT 1)`;

export function GET() {
  const trend = db
    .prepare(
      `SELECT e.id AS essay_id, e.created_at, e.word_count, e.time_taken_s,
              a.band_tr, a.band_cc, a.band_lr, a.band_gra, a.band_overall
       FROM essays e
       JOIN assessments a ON a.id = ${LATEST_ASSESSMENT}
       ORDER BY e.id ASC`,
    )
    .all();

  const recent = db
    .prepare(
      `SELECT e.id, e.created_at, e.word_count, p.text AS prompt_text, a.band_overall
       FROM essays e
       LEFT JOIN prompts p ON p.id = e.prompt_id
       LEFT JOIN assessments a ON a.id = ${LATEST_ASSESSMENT}
       ORDER BY e.id DESC LIMIT 5`,
    )
    .all();

  const errors = db
    .prepare(`SELECT category, COUNT(*) AS count FROM errors GROUP BY category ORDER BY count DESC`)
    .all();

  const totals = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM essays) AS essay_count,
         (SELECT COUNT(*) FROM essays WHERE created_at >= datetime('now', '-7 days')) AS essays_this_week,
         (SELECT COUNT(*) FROM assessments) AS assessment_count,
         (SELECT COALESCE(SUM(word_count), 0) FROM essays) AS words_written`,
    )
    .get();

  const unmarked = db
    .prepare(`SELECT COUNT(*) AS c FROM essays e WHERE ${LATEST_ASSESSMENT} IS NULL`)
    .get() as { c: number };

  return NextResponse.json({
    trend,
    recent,
    errors,
    totals: { ...(totals as object), unmarked: unmarked.c },
    llm: { configured: llmConfigError() === null, model: LLM.model, endpoint: LLM.baseURL, error: llmConfigError() },
  });
}
