"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Prompt = { id: number; type: string; category: string | null; text: string };

const EXAM_SECONDS = 40 * 60;
const DRAFT_KEY = "ielts.draft.v1";
const WARN_AT = [10 * 60, 5 * 60]; // the real test warns at 10 and 5 minutes

function mmss(total: number) {
  const s = Math.max(0, total);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function WritePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [body, setBody] = useState("");
  const [remaining, setRemaining] = useState(EXAM_SECONDS);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [split, setSplit] = useState(50); // % width of the question pane
  const [savedId, setSavedId] = useState<number | null>(null);
  const restored = useRef(false);
  const dragging = useRef(false);

  // Restore an in-progress attempt — losing 40 minutes to a refresh is unacceptable.
  // localStorage is unreadable until after hydration, so this has to be an effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setPrompt(d.prompt ?? null);
        setBody(d.body ?? "");
        setRemaining(typeof d.remaining === "number" ? d.remaining : EXAM_SECONDS);
      } catch {
        /* corrupt draft — ignore */
      }
    }
    restored.current = true;
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!restored.current) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ prompt, body, remaining }));
  }, [prompt, body, remaining]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [running, remaining]);

  // Draggable divider, like the real computer-delivered test.
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      setSplit(Math.min(75, Math.max(25, (e.clientX / window.innerWidth) * 100)));
    };
    const up = () => (dragging.current = false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  const drawPrompt = useCallback(async () => {
    setError(null);
    setBusy("Loading…");
    try {
      const res = await fetch("/api/prompts/random?type=task2");
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not draw a prompt");
      setPrompt(await res.json());
      setBody("");
      setRemaining(EXAM_SECONDS);
      setDismissed([]);
      setRunning(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, []);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  async function submit() {
    setError(null);
    setRunning(false);
    setBusy("Saving…");
    try {
      const save = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_id: prompt?.id ?? null,
          body,
          time_taken_s: EXAM_SECONDS - remaining,
        }),
      });
      if (!save.ok) throw new Error((await save.json()).error ?? "Could not save the essay");
      const { essay_id } = await save.json();
      setSavedId(essay_id);

      setBusy("Marking — about a minute…");
      const assess = await fetch(`/api/essays/${essay_id}/assess`, { method: "POST" });
      localStorage.removeItem(DRAFT_KEY);

      if (!assess.ok) {
        const { error: message } = await assess.json();
        setError(message);
        setBusy(null);
        return;
      }
      router.push(`/essays/${essay_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  }

  const low = remaining <= 5 * 60;
  // Derived, not stored: the largest un-dismissed warning threshold we've passed.
  const warning = running ? (WARN_AT.find((w) => remaining <= w && !dismissed.includes(w)) ?? null) : null;

  return (
    // The exam screen is fixed light, like the real thing — it ignores dark mode
    // so that what you practise on is what you sit in front of on the day.
    <div className="fixed inset-0 flex flex-col bg-[#f2f2f2] text-[#1a1a1a] [color-scheme:light]">
      {/* ── header bar ─────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-[#c9c9c9] bg-white px-4 py-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-[#e31e24]">IELTS</span>
          <span className="text-[11px] uppercase tracking-widest text-[#767676]">Practice</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke={low ? "#c1121f" : "#444"} strokeWidth="2" />
            <path d="M12 7v5l3 2" stroke={low ? "#c1121f" : "#444"} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className={`font-mono tabular-nums ${low ? "font-bold text-[#c1121f]" : ""}`}>
            {mmss(remaining)}
          </span>
          <span className="text-[#767676]">remaining</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {prompt && (
            <button
              onClick={() => setRunning((r) => !r)}
              disabled={remaining === 0}
              className="rounded border border-[#c9c9c9] bg-white px-2.5 py-1 hover:bg-[#f2f2f2] disabled:opacity-40"
            >
              {remaining === 0 ? "Time's up" : running ? "Pause" : "Resume"}
            </button>
          )}
          <button
            onClick={drawPrompt}
            disabled={!!busy}
            className="rounded border border-[#c9c9c9] bg-white px-2.5 py-1 hover:bg-[#f2f2f2] disabled:opacity-40"
          >
            {prompt ? "New task" : "Start"}
          </button>
          <Link href="/" className="text-[#767676] underline-offset-2 hover:underline">
            Exit
          </Link>
        </div>
      </header>

      <div className="h-[3px] shrink-0 bg-[#e6e6e6]">
        <div
          className={`h-full transition-[width] duration-1000 ease-linear ${low ? "bg-[#c1121f]" : "bg-[#8a8a8a]"}`}
          style={{ width: `${(remaining / EXAM_SECONDS) * 100}%` }}
        />
      </div>

      {warning !== null && (
        <div className="flex shrink-0 items-center justify-between border-b border-[#e0c200] bg-[#fff8dc] px-4 py-1.5 text-sm">
          <span>You have {warning / 60} minutes left.</span>
          <button
            onClick={() => setDismissed((d) => [...d, warning])}
            className="px-2 text-[#767676] hover:text-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── split panes ────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        <section
          style={{ width: `${split}%` }}
          className="overflow-y-auto border-r border-[#c9c9c9] bg-white px-6 py-5"
        >
          <h1 className="mb-3 text-base font-bold">Part 2</h1>
          {prompt ? (
            <div className="max-w-[52ch] space-y-3 text-[15px] leading-relaxed">
              <p>You should spend about 40 minutes on this task.</p>
              <p>Write about the following topic:</p>
              <blockquote className="border border-[#c9c9c9] bg-[#fafafa] px-4 py-3 whitespace-pre-line">
                {prompt.text}
              </blockquote>
              <p>
                Give reasons for your answer and include any relevant examples from your own
                knowledge or experience.
              </p>
              <p className="font-semibold">Write at least 250 words.</p>
            </div>
          ) : (
            <div className="max-w-[52ch] space-y-3 text-[15px] leading-relaxed text-[#555]">
              <p>
                Press <strong>Start</strong> to draw a Task 2 question. The clock begins
                immediately and runs for 40 minutes, exactly as it does on test day.
              </p>
              <ul className="space-y-1.5 border-l-2 border-[#e0e0e0] pl-4 text-[14px]">
                <li>Minimum 250 words — the counter turns green when you reach it.</li>
                <li>Warnings appear at 10 and 5 minutes remaining.</li>
                <li>Spell-check is off. The real test has none either.</li>
                <li>Your work is saved as you type; a refresh will not cost you the attempt.</li>
                <li>Drag the divider to resize the panes.</li>
              </ul>
            </div>
          )}
        </section>

        <div
          onMouseDown={() => (dragging.current = true)}
          className="w-1 shrink-0 cursor-col-resize bg-[#c9c9c9] hover:bg-[#999]"
          role="separator"
          aria-orientation="vertical"
        />

        <section className="flex min-w-0 flex-1 flex-col bg-white">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onFocus={() => prompt && remaining > 0 && setRunning(true)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={prompt ? "" : "Press Start to begin."}
            disabled={!prompt}
            className="min-h-0 flex-1 resize-none border-0 px-6 py-5 font-sans text-[15px] leading-7 outline-none disabled:bg-[#fafafa]"
          />
        </section>
      </div>

      {savedId !== null && error && !busy && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
          <div className="w-[34rem] max-w-[90vw] rounded-lg border border-[#c9c9c9] bg-white p-6 shadow-xl">
            <p className="font-semibold">Your essay is saved, but marking failed</p>
            <p className="mt-2 text-sm text-[#555]">{error}</p>
            <p className="mt-2 text-sm text-[#555]">
              Nothing is lost — essay #{savedId} can be marked from its page once a provider is set up.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setError(null)}
                className="rounded border border-[#c9c9c9] px-3 py-1.5 text-sm hover:bg-[#f2f2f2]"
              >
                Stay here
              </button>
              <Link
                href={`/essays/${savedId}`}
                className="rounded bg-[#1a1a1a] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                Go to essay #{savedId}
              </Link>
            </div>
          </div>
        </div>
      )}

      {busy?.startsWith("Marking") && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/85 backdrop-blur-sm">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#c9c9c9] border-t-[#e31e24]" />
          <p className="text-sm font-medium">Marking your essay</p>
          <p className="text-xs text-[#767676]">Usually under a minute. You&apos;ll be taken to the results.</p>
        </div>
      )}

      {/* ── footer bar ─────────────────────────────────────────── */}
      <footer className="flex shrink-0 items-center justify-between border-t border-[#c9c9c9] bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="rounded border border-[#1a1a1a] bg-[#1a1a1a] px-3 py-1 text-xs font-semibold text-white">
            Part 2
          </span>
          <span className="flex items-center gap-2.5 text-sm">
            <span>
              Words: <span className="font-mono tabular-nums">{words}</span>
            </span>
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#e6e6e6]">
              <span
                className={`block h-full rounded-full transition-[width] ${words >= 250 ? "bg-[#15803d]" : "bg-[#8a8a8a]"}`}
                style={{ width: `${Math.min(100, (words / 250) * 100)}%` }}
              />
            </span>
            {words > 0 && words < 250 && (
              <span className="text-[#767676]">{250 - words} to the minimum</span>
            )}
            {words >= 250 && <span className="text-[#15803d]">minimum met</span>}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {error && savedId === null && (
            <span className="max-w-[46ch] truncate text-sm text-[#c1121f]">{error}</span>
          )}
          <button
            onClick={submit}
            disabled={!!busy || words === 0}
            className="rounded border border-[#c9c9c9] bg-[#e31e24] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#c1121f] disabled:cursor-not-allowed disabled:bg-[#bbb]"
          >
            {busy ?? "Submit"}
          </button>
        </div>
      </footer>
    </div>
  );
}
