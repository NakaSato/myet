import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "task2";

  // Prefer prompts not used by the last 10 essays; fall back to any of that type.
  const row =
    db
      .prepare(
        `SELECT * FROM prompts
         WHERE type = ?
           AND id NOT IN (
             SELECT prompt_id FROM essays
             WHERE prompt_id IS NOT NULL
             ORDER BY id DESC LIMIT 10
           )
         ORDER BY RANDOM() LIMIT 1`,
      )
      .get(type) ??
    db.prepare("SELECT * FROM prompts WHERE type = ? ORDER BY RANDOM() LIMIT 1").get(type);

  if (!row) {
    return NextResponse.json({ error: `No prompts of type "${type}"` }, { status: 404 });
  }
  return NextResponse.json(row);
}
