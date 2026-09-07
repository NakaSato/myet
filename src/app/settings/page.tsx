"use client";

import { useEffect, useState } from "react";
import { Card, SectionTitle, Spinner } from "@/app/ui";

type Settings = {
  llm_base_url: string;
  llm_api_key: string;
  llm_model: string;
  has_api_key: boolean;
  target_band: number;
  weekly_goal: number;
  total_goal: number;
  exam_minutes: number;
  min_words: number;
};

type TestResult = { ok: boolean; error?: string; model?: string; ms?: number; reply?: string };

const PRESETS = [
  {
    name: "Groq",
    note: "free tier · fast",
    llm_base_url: "https://api.groq.com/openai/v1",
    llm_model: "llama-3.3-70b-versatile",
    keyUrl: "https://console.groq.com/keys",
  },
  {
    name: "OpenRouter",
    note: "~$0.002 / essay",
    llm_base_url: "https://openrouter.ai/api/v1",
    llm_model: "deepseek/deepseek-chat",
    keyUrl: "https://openrouter.ai/keys",
  },
  {
    name: "Ollama",
    note: "local · free · no key",
    llm_base_url: "http://localhost:11434/v1",
    llm_model: "qwen2.5:14b",
    keyUrl: null,
  },
];

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [test, setTest] = useState<TestResult | null>(null);
  const [calibration, setCalibration] = useState<{
    results?: { id: string; official: number; tool?: number; delta?: number; error?: string }[];
    mean_delta?: number | null;
    verdict?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setS(d.settings));
  }, []);

  if (!s) return <Spinner label="Loading…" />;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setS({ ...s, [k]: v });
    setSaved(false);
  };

  async function save(patch?: Partial<Settings>) {
    setBusy("Saving…");
    const body = { ...s, ...patch, llm_api_key: key };
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    setS(d.settings);
    setKey("");
    setSaved(true);
    setBusy(null);
    setTest(null);
  }

  async function runTest() {
    setBusy("Testing…");
    setTest(null);
    const res = await fetch("/api/settings/test", { method: "POST" });
    setTest(await res.json());
    setBusy(null);
  }

  async function runCalibration() {
    setBusy("Calibrating — two essays, about two minutes…");
    setCalibration(null);
    const res = await fetch("/api/calibrate", { method: "POST" });
    setCalibration(await res.json());
    setBusy(null);
  }

  const local = /localhost|127\.0\.0\.1/.test(s.llm_base_url);
  const ready = s.llm_base_url && s.llm_model && (local || s.has_api_key);

  return (
    <div className="space-y-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        {saved && <span className="text-xs text-good">Saved</span>}
      </div>

      {/* ── provider ───────────────────────────────────────────── */}
      <section>
        <SectionTitle>Marking provider</SectionTitle>
        <Card className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setS({ ...s, llm_base_url: p.llm_base_url, llm_model: p.llm_model })}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  s.llm_base_url === p.llm_base_url
                    ? "border-accent bg-accent-soft"
                    : "border-line hover:bg-panel-2"
                }`}
              >
                <span className="block text-sm font-medium">{p.name}</span>
                <span className="block text-xs text-muted">{p.note}</span>
              </button>
            ))}
          </div>

          <Field label="Endpoint" hint="Any OpenAI-compatible base URL.">
            <input
              value={s.llm_base_url}
              onChange={(e) => set("llm_base_url", e.target.value)}
              spellCheck={false}
              className="input font-mono"
            />
          </Field>

          <Field label="Model" hint="Exact model id as the provider spells it.">
            <input
              value={s.llm_model}
              onChange={(e) => set("llm_model", e.target.value)}
              spellCheck={false}
              className="input font-mono"
            />
          </Field>

          <Field
            label="API key"
            hint={
              local
                ? "Local endpoints need no key."
                : s.has_api_key
                  ? "A key is stored. Type a new one to replace it."
                  : "Stored in app.db on this machine, which is gitignored."
            }
          >
            <div className="flex gap-2">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={s.has_api_key ? "•••••••••••••••• stored" : "sk-…"}
                spellCheck={false}
                className="input flex-1 font-mono"
              />
              {s.has_api_key && (
                <button
                  onClick={async () => {
                    await fetch("/api/settings", { method: "DELETE" });
                    const d = await (await fetch("/api/settings")).json();
                    setS(d.settings);
                  }}
                  className="btn-secondary"
                >
                  Clear
                </button>
              )}
            </div>
          </Field>

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button onClick={() => save()} disabled={!!busy} className="btn-primary">
              {busy === "Saving…" ? "Saving…" : "Save"}
            </button>
            <button onClick={runTest} disabled={!!busy || !ready} className="btn-secondary">
              {busy === "Testing…" ? "Testing…" : "Test connection"}
            </button>
            {!ready && <span className="text-xs text-muted">Set an endpoint, model and key first.</span>}
            {test?.ok && (
              <span className="text-sm text-good">
                Connected in {test.ms} ms — {test.model} replied “{test.reply}”
              </span>
            )}
            {test && !test.ok && <span className="text-sm text-bad">{test.error}</span>}
          </div>

          <p className="text-xs text-muted">
            Changes take effect immediately — no restart. These override anything in{" "}
            <code className="rounded bg-panel-2 px-1 py-0.5 font-mono">.env.local</code>.
          </p>
        </Card>
      </section>

      {/* ── calibration ────────────────────────────────────────── */}
      <section>
        <SectionTitle>Calibration</SectionTitle>
        <Card className="space-y-4 p-5">
          <p className="text-sm text-muted">
            Marks the two official sample responses that real examiners scored band 5.5 and 7.5, and
            reports the gap. Two LLM calls; writes nothing to your essays. Run it once per model.
          </p>
          <button onClick={runCalibration} disabled={!!busy || !ready} className="btn-secondary">
            {busy?.startsWith("Calibrating") ? "Calibrating…" : "Run calibration"}
          </button>

          {calibration?.error && <p className="text-sm text-bad">{calibration.error}</p>}
          {calibration?.results && (
            <div className="space-y-2 border-t border-line pt-4">
              {calibration.results.map((r) => (
                <div key={r.id} className="flex items-baseline gap-3 font-mono text-sm">
                  <span className="text-muted">examiner {r.official.toFixed(1)}</span>
                  <span>→ tool {r.tool?.toFixed(1) ?? "—"}</span>
                  {r.delta != null && (
                    <span className={Math.abs(r.delta) >= 0.5 ? "text-bad" : "text-good"}>
                      {r.delta > 0 ? "+" : ""}
                      {r.delta.toFixed(1)}
                    </span>
                  )}
                  {r.error && <span className="text-bad">{r.error}</span>}
                </div>
              ))}
              {calibration.verdict && (
                <p className="pt-1 text-sm">
                  <span className="text-muted">
                    mean {calibration.mean_delta! > 0 ? "+" : ""}
                    {calibration.mean_delta} —{" "}
                  </span>
                  {calibration.verdict}
                </p>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* ── goals ──────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Targets</SectionTitle>
        <Card className="grid gap-5 p-5 sm:grid-cols-3">
          <Field label="Target band" hint="Scores at or above this show green.">
            <input
              type="number" step="0.5" min="4" max="9"
              value={s.target_band}
              onChange={(e) => set("target_band", Number(e.target.value))}
              className="input font-mono"
            />
          </Field>
          <Field label="Essays per week" hint="The habit that decides this works.">
            <input
              type="number" min="1" max="21"
              value={s.weekly_goal}
              onChange={(e) => set("weekly_goal", Number(e.target.value))}
              className="input font-mono"
            />
          </Field>
          <Field label="Essays before the exam" hint="Self-study baseline is 5–6.">
            <input
              type="number" min="1" max="200"
              value={s.total_goal}
              onChange={(e) => set("total_goal", Number(e.target.value))}
              className="input font-mono"
            />
          </Field>
        </Card>
      </section>

      {/* ── exam ───────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Exam conditions</SectionTitle>
        <Card className="grid gap-5 p-5 sm:grid-cols-2">
          <Field label="Minutes" hint="The real Task 2 allows 40.">
            <input
              type="number" min="5" max="120"
              value={s.exam_minutes}
              onChange={(e) => set("exam_minutes", Number(e.target.value))}
              className="input font-mono"
            />
          </Field>
          <Field label="Minimum words" hint="The real Task 2 requires 250.">
            <input
              type="number" min="50" max="1000"
              value={s.min_words}
              onChange={(e) => set("min_words", Number(e.target.value))}
              className="input font-mono"
            />
          </Field>
        </Card>
      </section>

      <div className="flex items-center gap-3 border-t border-line pt-6">
        <button onClick={() => save()} disabled={!!busy} className="btn-primary">
          Save all settings
        </button>
        {busy && <span className="text-sm text-muted">{busy}</span>}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
