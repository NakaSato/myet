"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { Assessment } from "@/lib/assess";
import { Band, BandScale, CATEGORY_LABEL, CRITERIA, Card, SectionTitle, Spinner, formatDate } from "@/app/ui";

type Essay = {
  id: number;
  body: string;
  word_count: number;
  time_taken_s: number | null;
  created_at: string;
  prompt_text: string | null;
};

type AssessmentRow = {
  id: number;
  band_overall: number;
  band_tr: number;
  band_cc: number;
  band_lr: number;
  band_gra: number;
  model_used: string;
  created_at: string;
  feedback: Assessment;
};

type Correction = Assessment["corrections"][number];
type Segment = { text: string; idx: number | null };

/** Split the essay into plain / highlighted runs, one per located correction. */
function segment(body: string, corrections: Correction[]): { segments: Segment[]; located: Set<number> } {
  const lower = body.toLowerCase();
  const ranges: { start: number; end: number; idx: number }[] = [];

  corrections.forEach((c, idx) => {
    const needle = c.original.trim();
    if (needle.length < 3) return;
    let start = body.indexOf(needle);
    if (start === -1) start = lower.indexOf(needle.toLowerCase());
    if (start !== -1) ranges.push({ start, end: start + needle.length, idx });
  });

  ranges.sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  const located = new Set<number>();
  let cursor = 0;
  for (const r of ranges) {
    if (r.start < cursor) continue; // overlaps a previous highlight — list only
    if (r.start > cursor) segments.push({ text: body.slice(cursor, r.start), idx: null });
    segments.push({ text: body.slice(r.start, r.end), idx: r.idx });
    located.add(r.idx);
    cursor = r.end;
  }
  if (cursor < body.length) segments.push({ text: body.slice(cursor), idx: null });
  return { segments, located };
}

export default function EssayReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ essay: Essay; assessments: AssessmentRow[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const listRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch(`/api/essays/${id}`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  const latest = data?.assessments[0];
  const corrections = useMemo(() => latest?.feedback.corrections ?? [], [latest]);
  const { segments, located } = useMemo(
    () => (data ? segment(data.essay.body, corrections) : { segments: [], located: new Set<number>() }),
    [data, corrections],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function reassess() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/essays/${id}/assess`, { method: "POST" });
    if (!res.ok) setError((await res.json()).error ?? "Marking failed");
    setData(await (await fetch(`/api/essays/${id}`)).json());
    setActive(null);
    setBusy(false);
  }

  function select(idx: number, scrollList = false) {
    setActive((a) => (a === idx ? null : idx));
    if (scrollList) listRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (!data) return <Spinner label="Loading…" />;
  const { essay, assessments } = data;

  return (
    <div className="space-y-10">
      {/* ── header ───────────────────────────────────────────── */}
      <section className="space-y-2">
        <p className="font-mono text-xs text-muted">
          Essay #{essay.id} · {formatDate(essay.created_at)} · {essay.word_count} words
          {essay.time_taken_s != null && ` · ${Math.round(essay.time_taken_s / 60)} min`}
        </p>
        <button
          onClick={() => setShowPrompt((s) => !s)}
          className={`text-left text-[15px] leading-relaxed ${showPrompt ? "" : "line-clamp-2"}`}
          title={showPrompt ? "Collapse" : "Show the full question"}
        >
          {essay.prompt_text ?? "(no prompt recorded)"}
        </button>
      </section>

      {latest ? (
        <>
          {/* ── score strip ────────────────────────────────────── */}
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-[15rem] flex-1">
                <p className="eyebrow">Overall</p>
                <div className="mt-1.5">
                  <Band value={latest.band_overall} size="lg" />
                </div>
                <BandScale value={latest.band_overall} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CRITERIA.map((c) => (
                  <a
                    key={c.key}
                    href={`#${c.key}`}
                    className="rounded-xl border border-line px-3 py-2.5 transition-colors hover:bg-panel-2"
                  >
                    <span className="block text-[11px] leading-tight text-muted">{c.label}</span>
                    <span className="mt-1.5 block">
                      <Band value={latest[c.col]} size="md" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </Card>

          {/* ── fix first ─────────────────────────────────────── */}
          <section className="rounded-[14px] border border-accent/30 bg-accent-soft px-5 py-4">
            <p className="eyebrow">Fix this first</p>
            <p className="mt-1 text-[15px] leading-relaxed">{latest.feedback.top_priority}</p>
          </section>

          {/* ── essay with highlights ─────────────────────────── */}
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <SectionTitle>Your essay</SectionTitle>
              <span className="text-xs text-muted">
                {located.size} of {corrections.length} corrections highlighted · click one
              </span>
            </div>
            <Card className="relative p-6">
              <p className="whitespace-pre-wrap text-[15px] leading-8">
                {segments.map((s, i) =>
                  s.idx === null ? (
                    <span key={i}>{s.text}</span>
                  ) : (
                    <mark
                      key={i}
                      onClick={() => select(s.idx!, true)}
                      title={corrections[s.idx].corrected}
                      className={`cursor-pointer rounded-[3px] bg-mark px-0.5 text-foreground transition-shadow ${
                        active === s.idx ? "ring-2 ring-mark-ring" : "hover:ring-2 hover:ring-mark-ring/50"
                      }`}
                    >
                      {s.text}
                      <sup className="ml-0.5 font-mono text-[9px] font-semibold text-mark-ring">
                        {s.idx + 1}
                      </sup>
                    </mark>
                  ),
                )}
              </p>
              {active !== null && corrections[active] && (
                <div className="mt-5 border-t border-line pt-4">
                  <CorrectionBody c={corrections[active]} />
                </div>
              )}
            </Card>
          </section>

          {/* ── criteria ──────────────────────────────────────── */}
          <section className="space-y-3">
            <SectionTitle>By criterion</SectionTitle>
            {CRITERIA.map((c) => {
              const f = latest.feedback[c.key];
              return (
                <Card key={c.key} id={c.key} className="scroll-mt-20 p-5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-medium">{c.label}</h3>
                    <Band value={f.band} size="md" />
                  </div>
                  <blockquote className="mt-3 border-l-2 border-line pl-3 text-sm leading-relaxed text-muted">
                    {f.evidence}
                  </blockquote>
                  <p className="mt-3 text-sm leading-relaxed">
                    <span className="font-medium">To move up: </span>
                    {f.how_to_improve}
                  </p>
                </Card>
              );
            })}
          </section>

          {/* ── all corrections ───────────────────────────────── */}
          <section>
            <SectionTitle>All corrections ({corrections.length})</SectionTitle>
            <div className="space-y-2">
              {corrections.map((c, idx) => (
                <div
                  key={idx}
                  ref={(el) => {
                    listRefs.current[idx] = el;
                  }}
                  onClick={() => select(idx)}
                  className={`flex cursor-pointer gap-3 rounded-[14px] border p-4 transition-colors ${
                    active === idx ? "border-mark-ring bg-panel-2" : "border-line bg-panel hover:bg-panel-2"
                  }`}
                >
                  <span className="mt-0.5 font-mono text-xs text-muted">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <CorrectionBody c={c} located={located.has(idx)} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <Card className="p-6 text-sm text-muted">Not marked yet.</Card>
      )}

      {/* ── footer ────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <button
          onClick={reassess}
          disabled={busy}
          className="btn-secondary"
        >
          {busy ? "Marking…" : latest ? "Mark again" : "Mark this essay"}
        </button>
        {latest && (
          <span className="font-mono text-xs text-muted">
            {assessments.length} marking{assessments.length > 1 ? "s" : ""} · {latest.model_used}
          </span>
        )}
        {error && <span className="text-sm text-bad">{error}</span>}
      </section>
    </div>
  );
}

function CorrectionBody({ c, located }: { c: Correction; located?: boolean }) {
  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">
          {CATEGORY_LABEL[c.category] ?? c.category}
        </span>
        {located === false && <span className="text-[11px] text-muted">not located in text</span>}
      </div>
      <p className="text-bad line-through decoration-bad/40">{c.original}</p>
      <p className="text-good">{c.corrected}</p>
      <p className="text-muted">{c.why}</p>
    </div>
  );
}
