import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const essay = db
    .prepare(
      `SELECT e.*, p.text AS prompt_text, p.category
       FROM essays e LEFT JOIN prompts p ON p.id = e.prompt_id
       WHERE e.id = ?`,
    )
    .get(id);

  if (!essay) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assessments = db
    .prepare("SELECT * FROM assessments WHERE essay_id = ? ORDER BY id DESC")
    .all(id) as Array<Record<string, unknown> & { feedback_json: string }>;

  return NextResponse.json({
    essay,
    assessments: assessments.map((a) => ({ ...a, feedback: JSON.parse(a.feedback_json) })),
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  // Cascade by hand — the schema has no ON DELETE, and orphaned errors would
  // keep skewing the "what keeps costing you marks" counts.
  const removed = db.transaction(() => {
    db.prepare(
      "DELETE FROM errors WHERE assessment_id IN (SELECT id FROM assessments WHERE essay_id = ?)",
    ).run(id);
    db.prepare("DELETE FROM assessments WHERE essay_id = ?").run(id);
    return db.prepare("DELETE FROM essays WHERE id = ?").run(id).changes;
  })();

  if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ deleted: Number(id) });
}
