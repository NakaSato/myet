import { db } from "./db";

/**
 * Settings live in the database, not in .env.local, so changing a provider or a
 * goal takes effect immediately — no file editing, no server restart. Env vars
 * still work as the fallback, which keeps `npm run calibrate` and a fresh clone
 * working before anything has been configured.
 */
export type Settings = {
  llm_base_url: string;
  llm_api_key: string;
  llm_model: string;
  target_band: number;
  weekly_goal: number;
  total_goal: number;
  exam_minutes: number;
  min_words: number;
};

const DEFAULTS: Settings = {
  llm_base_url: "https://openrouter.ai/api/v1",
  llm_api_key: "",
  llm_model: "deepseek/deepseek-chat",
  target_band: 7,
  weekly_goal: 3,
  total_goal: 20,
  exam_minutes: 40,
  min_words: 250,
};

const NUMERIC = new Set(["target_band", "weekly_goal", "total_goal", "exam_minutes", "min_words"]);

const ENV_FALLBACK: Partial<Record<keyof Settings, string | undefined>> = {
  llm_base_url: process.env.LLM_BASE_URL,
  llm_api_key: process.env.LLM_API_KEY,
  llm_model: process.env.LLM_MODEL,
};

export function getSettings(): Settings {
  const rows = db.prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const out = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS) as (keyof Settings)[]) {
    const raw = stored[key] ?? ENV_FALLBACK[key] ?? null;
    if (raw == null || raw === "") continue;
    // @ts-expect-error — the union is keyed by name, and NUMERIC guards the split
    out[key] = NUMERIC.has(key) ? Number(raw) : raw;
  }
  return out;
}

export function saveSettings(patch: Partial<Settings>) {
  const stmt = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  db.transaction(() => {
    for (const [key, value] of Object.entries(patch)) {
      if (!(key in DEFAULTS)) continue;
      stmt.run(key, String(value));
    }
  })();
  return getSettings();
}

/** Never send the key back to the browser — only whether one is set. */
export function publicSettings() {
  const s = getSettings();
  return { ...s, llm_api_key: "", has_api_key: s.llm_api_key !== "" };
}

export function isLocalEndpoint(url: string) {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(url);
}

/** null when marking can run, otherwise the reason it can't. */
export function llmConfigError(s: Settings = getSettings()): string | null {
  if (!s.llm_base_url) return "No endpoint set. Add one in Settings.";
  if (!s.llm_model) return "No model set. Add one in Settings.";
  if (!s.llm_api_key && !isLocalEndpoint(s.llm_base_url))
    return `No API key set for ${s.llm_base_url}. Add one in Settings.`;
  return null;
}
