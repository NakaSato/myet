"use client";

import { useEffect, useState } from "react";
import { Band, CATEGORY_LABEL, Card, EmptyState, SectionTitle, Spinner } from "@/app/ui";

type TrendPoint = {
  essay_id: number;
  created_at: string;
  word_count: number;
  band_tr: number;
  band_cc: number;
  band_lr: number;
  band_gra: number;
  band_overall: number;
};

type Stats = {
  trend: TrendPoint[];
  errors: { category: string; count: number }[];
  totals: { essay_count: number; assessment_count: number; words_written: number };
};

const BAND_MIN = 4;
const BAND_MAX = 9;

const CRITERIA = [
  { key: "band_tr", label: "Task Response" },
  { key: "band_cc", label: "Coherence & Cohesion" },
  { key: "band_lr", label: "Lexical Resource" },
  { key: "band_gra", label: "Grammatical Range" },
] as const;

/** Line chart of one band series. Single series, so the title carries identity. */
function BandChart({
  points,
  label,
  height = 190,
  compact = false,
}: {
  points: { x: number; y: number; id: number }[];
  label: string;
  height?: number;
  compact?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const w = 640;
  const pad = compact ? { t: 8, r: 8, b: 18, l: 24 } : { t: 10, r: 12, b: 24, l: 30 };
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;

  const n = points.length;
  const px = (i: number) => pad.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const py = (band: number) =>
    pad.t + ih - ((band - BAND_MIN) / (BAND_MAX - BAND_MIN)) * ih;

  const path = points.map((p, i) => `${i ? "L" : "M"}${px(i)},${py(p.y)}`).join(" ");
  const ticks = [4, 5, 6, 7, 8, 9];
  const active = hover != null ? points[hover] : null;

  return (
    <figure className="space-y-1.5">
      <figcaption className="flex items-baseline justify-between text-sm">
        <span className={compact ? "text-muted" : "font-medium"}>{label}</span>
        <span className="font-mono tabular-nums">
          {active ? active.y.toFixed(1) : points[n - 1]?.y.toFixed(1)}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="w-full"
        role="img"
        aria-label={`${label} by essay`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              x2={w - pad.r}
              y1={py(t)}
              y2={py(t)}
              stroke="var(--grid)"
              strokeWidth={1}
            />
            <text
              x={pad.l - 6}
              y={py(t) + 3.5}
              textAnchor="end"
              className="fill-[var(--muted)]"
              fontSize={compact ? 8 : 10}
              fontFamily="var(--font-geist-mono), monospace"
            >
              {t}
            </text>
          </g>
        ))}

        <path d={path} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" />

        {points.map((p, i) => (
          <circle
            key={p.id}
            cx={px(i)}
            cy={py(p.y)}
            r={hover === i ? 5.5 : 4}
            fill="var(--series-1)"
            stroke="var(--background)"
            strokeWidth={2}
          />
        ))}

        {/* Generous hit targets, wider than the marks themselves. */}
        {points.map((p, i) => (
          <rect
            key={`hit-${p.id}`}
            x={px(i) - (n === 1 ? iw / 2 : iw / (n - 1) / 2)}
            y={pad.t}
            width={n === 1 ? iw : iw / (n - 1)}
            height={ih}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {active && (
          <line
            x1={px(hover!)}
            x2={px(hover!)}
            y1={pad.t}
            y2={pad.t + ih}
            stroke="var(--muted)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {!compact &&
          points.map((p, i) => (
            <text
              key={`x-${p.id}`}
              x={px(i)}
              y={height - 6}
              textAnchor="middle"
              className="fill-[var(--muted)]"
              fontSize={9}
              fontFamily="var(--font-geist-mono), monospace"
            >
              #{p.id}
            </text>
          ))}
      </svg>
    </figure>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <Spinner label="Loading…" />;

  const { trend, errors, totals } = stats;

  if (trend.length === 0) {
    return <EmptyState title="Nothing to plot yet" body="The trend starts with your first marked essay." />;
  }

  const latest = trend[trend.length - 1];
  const first = trend[0];
  const delta = latest.band_overall - first.band_overall;
  const maxErrors = Math.max(...errors.map((e) => e.count), 1);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
      <section className="grid grid-cols-3 gap-3">
        <Card className="p-5">
          <Band value={latest.band_overall} size="lg" />
          <div className="mt-2 text-xs text-muted">
            latest overall
            {trend.length > 1 && (
              <span className={delta >= 0 ? " text-good" : " text-bad"}>
                {" "}
                {delta >= 0 ? "+" : ""}
                {delta.toFixed(1)} since #{first.essay_id}
              </span>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-mono text-5xl font-medium leading-none tabular-nums tracking-tight">{totals.essay_count}</div>
          <div className="mt-2 text-xs text-muted">essays written · target 20</div>
        </Card>
        <Card className="p-5">
          <div className="font-mono text-5xl font-medium leading-none tabular-nums tracking-tight">
            {totals.words_written.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-muted">words under exam conditions</div>
        </Card>
      </section>

      <Card className="p-5">
        <BandChart
          label="Overall band by essay"
          points={trend.map((t) => ({ x: t.essay_id, y: t.band_overall, id: t.essay_id }))}
        />
      </Card>

      <section className="grid gap-4 sm:grid-cols-2">
        {CRITERIA.map((c) => (
          <Card key={c.key} className="p-5">
            <BandChart
              compact
              height={120}
              label={c.label}
              points={trend.map((t) => ({ x: t.essay_id, y: t[c.key], id: t.essay_id }))}
            />
          </Card>
        ))}
      </section>

      {errors.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Recurring errors</SectionTitle>
          <div className="space-y-1.5">
            {errors.map((e) => (
              <div key={e.category} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 text-muted">{CATEGORY_LABEL[e.category] ?? e.category}</span>
                <div className="flex-1">
                  <div
                    className="h-4 rounded-r-[4px] bg-[var(--series-1)]"
                    style={{ width: `${Math.max((e.count / maxErrors) * 100, 2)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono tabular-nums">{e.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-muted">Table view</summary>
        <table className="mt-3 w-full font-mono text-xs">
          <thead className="text-muted">
            <tr className="border-b border-line text-left">
              <th className="py-1.5">essay</th>
              <th>TR</th>
              <th>CC</th>
              <th>LR</th>
              <th>GRA</th>
              <th>overall</th>
              <th>words</th>
            </tr>
          </thead>
          <tbody>
            {trend.map((t) => (
              <tr key={t.essay_id} className="border-b border-line/50">
                <td className="py-1.5">#{t.essay_id}</td>
                <td>{t.band_tr}</td>
                <td>{t.band_cc}</td>
                <td>{t.band_lr}</td>
                <td>{t.band_gra}</td>
                <td>{t.band_overall}</td>
                <td>{t.word_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
