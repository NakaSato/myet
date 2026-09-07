"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Band, CRITERIA, Card, CriteriaBars, EmptyState, Spinner, formatDate } from "@/app/ui";

type Row = {
  id: number;
  word_count: number;
  time_taken_s: number | null;
  created_at: string;
  prompt_text: string | null;
  category: string | null;
  band_overall: number | null;
  band_tr: number | null;
  band_cc: number | null;
  band_lr: number | null;
  band_gra: number | null;
};

export default function EssaysPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch("/api/essays")
      .then((r) => r.json())
      .then(setRows);
  }, []);

  if (!rows) return <Spinner label="Loading…" />;
  if (rows.length === 0)
    return <EmptyState title="No essays yet" body="Everything you write under the clock ends up here." />;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Essays</h1>
        <span className="font-mono text-xs text-muted">{rows.length} written</span>
      </div>

      <Card className="divide-y divide-line">
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/essays/${r.id}`}
            className="grid grid-cols-[4rem_1fr] gap-x-4 gap-y-1 px-5 py-4 transition-colors first:rounded-t-[14px] last:rounded-b-[14px] hover:bg-panel-2 sm:grid-cols-[4rem_1fr_auto]"
          >
            <div className="row-span-2 flex flex-col items-start gap-1.5 self-center">
              {r.band_overall == null ? (
                <span className="eyebrow !text-[10px]">unmarked</span>
              ) : (
                <>
                  <Band value={r.band_overall} size="md" />
                  <CriteriaBars bands={[r.band_tr, r.band_cc, r.band_lr, r.band_gra]} />
                </>
              )}
            </div>
            <p className="line-clamp-2 text-sm leading-relaxed sm:col-span-2">
              {r.prompt_text ?? "(no prompt recorded)"}
            </p>
            <p className="font-mono text-xs text-muted">
              {formatDate(r.created_at)} · {r.word_count} words
              {r.time_taken_s != null && ` · ${Math.round(r.time_taken_s / 60)} min`}
            </p>
            {r.band_tr != null && (
              <p className="flex gap-3 font-mono text-xs text-muted sm:justify-end">
                {CRITERIA.map((c) => (
                  <span key={c.key}>
                    {c.short} <span className="text-foreground">{r[c.col]}</span>
                  </span>
                ))}
              </p>
            )}
          </Link>
        ))}
      </Card>
    </div>
  );
}
