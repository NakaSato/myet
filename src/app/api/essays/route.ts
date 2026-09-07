import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countWords } from "@/lib/assess";

export const dynamic = "force-dynamic";

export function GET() {
  const rows = db
    .prepare(
      `SELECT e.id, e.body, e.word_count, e.time_taken_s, e.created_at,
              p.text AS prompt_text, p.category,
              a.band_overall, a.band_tr, a.band_cc, a.band_lr, a.band_gra
       FROM essays e
       LEFT JOIN prompts p ON p.id = e.prompt_id
       LEFT JOIN assessments a ON a.id = (
         SELECT id FROM assessments WHERE essay_id = e.id ORDER BY id DESC LIMIT 1
       )
       ORDER BY e.id DESC`,
    )
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { prompt_id, body, time_taken_s } = await req.json();

  if (typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const info = db
    .prepare(
      "INSERT INTO essays (prompt_id, body, word_count, time_taken_s) VALUES (?, ?, ?, ?)",
    )
    .run(prompt_id ?? null, body, countWords(body), time_taken_s ?? null);

  return NextResponse.json({ essay_id: info.lastInsertRowid }, { status: 201 });
}
