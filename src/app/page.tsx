"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Band,
  BandScale,
  CATEGORY_LABEL,
  Card,
  CriteriaBars,
  EmptyState,
  SectionTitle,
  Spinner,
  TARGET_BAND,
  formatDate,
} from "./ui";

type Stats = {
  trend: {
    essay_id: number;
    band_overall: number;
    band_tr: number;
    band_cc: number;
    band_lr: number;
    band_gra: number;
  }[];
  recent: {
    id: number;
    created_at: string;
    word_count: number;
    prompt_text: string | null;
    band_overall: number | null;
  }[];
  errors: { category: string; count: number }[];
  totals: { essay_count: number; essays_this_week: number; words_written: number; unmarked: number };
  llm: { configured: boolean; model: string; endpoint: string; error: string | null };
};

const WEEKLY_GOAL = 3;
const TOTAL_GOAL = 20;

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <Spinner label="Loading…" />;

  const { trend, recent, errors, totals, llm } = stats;
  const last = trend.at(-1) ?? null;
  const previous = trend.at(-2)?.band_overall ?? null;
  const delta = last && previous != null ? last.band_overall - previous : null;
  const topErrors = errors.slice(0, 3);
  const totalErrors = errors.reduce((s, e) => s + e.count, 0);
  const banner = !llm.configured ? <ProviderBanner error={llm.error} /> : null;

  return (
    <div className="space-y-10">
      {banner}

      {/* ── hero ─────────────────────────────────────────────── */}
      <Card className="relative overflow-hidden p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-soft blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-8">
          <div className="min-w-0">
            <p className="eyebrow">Latest band</p>
            {last ? (
              <>
                <div className="mt-2 flex items-baseline gap-4">
                  <Band value={last.band_overall} size="xl" />
                  <div className="text-sm text-muted">
                    <div>target {TARGET_BAND.toFixed(1)}</div>
                    {delta != null && delta !== 0 && (
                      <div className={delta > 0 ? "text-good" : "text-bad"}>
                        {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)} since last essay
                      </div>
                    )}
                  </div>
                </div>
                <BandScale value={last.band_overall} />
                <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                  <CriteriaBars bands={[last.band_tr, last.band_cc, last.band_lr, last.band_gra]} />
                  <span className="font-mono">
                    TR {last.band_tr} · CC {last.band_cc} · LR {last.band_lr} · GRA {last.band_gra}
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-2xl font-medium tracking-tight text-muted">
                  {totals.essay_count === 0 ? "Nothing marked yet" : "No marked essay yet"}
                </p>
                <BandScale value={null} />
                {totals.unmarked > 0 && (
                  <Link href="/essays" className="mt-3 inline-block text-sm underline underline-offset-4">
                    {totals.unmarked} essay{totals.unmarked > 1 ? "s" : ""} waiting to be marked →
                  </Link>
                )}
              </>
            )}
          </div>
          <Link href="/write" className="btn-primary shrink-0 !px-5 !py-3">
            Start a timed essay <span aria-hidden>→</span>
          </Link>
        </div>
      </Card>

      {totals.essay_count === 0 ? (
        <EmptyState
          title="Your first essay is 40 minutes away"
          body="Write under the clock, get marked against the official band descriptors in about a minute, and see what to fix first."
        />
      ) : (
        <>
          {/* ── goals ─────────────────────────────────────────── */}
          <section className="grid gap-3 sm:grid-cols-2">
            <Goal
              label="This week"
              value={totals.essays_this_week}
              goal={WEEKLY_GOAL}
              unit="essays"
              hint={
                totals.essays_this_week >= WEEKLY_GOAL
                  ? "Goal met — keep the habit."
                  : `${WEEKLY_GOAL - totals.essays_this_week} more to hit the weekly goal.`
              }
            />
            <Goal
              label="Before the exam"
              value={totals.essay_count}
              goal={TOTAL_GOAL}
              unit="essays"
              hint={`${totals.words_written.toLocaleString()} words under exam conditions.`}
            />
          </section>

          {/* ── errors ────────────────────────────────────────── */}
          {topErrors.length > 0 && (
            <section>
              <SectionTitle>What keeps costing you marks</SectionTitle>
              <Card className="divide-y divide-line">
                {topErrors.map((e, i) => (
                  <div key={e.category} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="w-5 font-mono text-sm text-muted">{i + 1}</span>
                    <span className="flex-1 text-sm">{CATEGORY_LABEL[e.category] ?? e.category}</span>
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-foreground/70"
                        style={{ width: `${(e.count / topErrors[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-mono text-sm tabular-nums text-muted">
                      {e.count} <span className="text-xs">· {Math.round((e.count / totalErrors) * 100)}%</span>
                    </span>
                  </div>
                ))}
              </Card>
            </section>
          )}

          {/* ── recent ────────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <SectionTitle>Recent essays</SectionTitle>
              <Link href="/essays" className="text-xs text-muted hover:text-foreground">
                All essays →
              </Link>
            </div>
            <Card className="divide-y divide-line">
              {recent.map((e) => (
                <Link
                  key={e.id}
                  href={`/essays/${e.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors first:rounded-t-[14px] last:rounded-b-[14px] hover:bg-panel-2"
                >
                  <div className="w-16 shrink-0">
                    {e.band_overall == null ? (
                      <span className="eyebrow !text-[10px]">unmarked</span>
                    ) : (
                      <Band value={e.band_overall} size="md" />
                    )}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm">{e.prompt_text ?? "(no prompt)"}</p>
                  <span className="shrink-0 font-mono text-xs text-muted">{formatDate(e.created_at)}</span>
                </Link>
              ))}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function Goal({
  label,
  value,
  goal,
  unit,
  hint,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  hint: string;
}) {
  const pct = Math.min(100, (value / goal) * 100);
  const done = value >= goal;
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-sm tabular-nums">
          <span className={done ? "text-good" : ""}>{value}</span>
          <span className="text-muted"> / {goal} {unit}</span>
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${done ? "bg-good" : "bg-foreground"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </Card>
  );
}

function ProviderBanner({ error }: { error: string | null }) {
  return (
    <div className="rounded-[14px] border border-bad/40 bg-bad/5 px-5 py-4 text-sm">
      <p className="font-medium text-bad">Marking is switched off — no LLM provider configured.</p>
      <p className="mt-1 text-muted">{error}</p>
      <p className="mt-2 text-muted">
        Copy <Code>.env.local.example</Code> to <Code>.env.local</Code>, pick a provider block, restart{" "}
        <Code>npm run dev</Code>. Essays you write meanwhile are saved and can be marked later.
      </p>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-panel-2 px-1 py-0.5 font-mono text-xs">{children}</code>;
}
