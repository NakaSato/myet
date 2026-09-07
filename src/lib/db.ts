import Database from "better-sqlite3";
import path from "node:path";
import { SEED_PROMPTS } from "./seed-prompts";

const DB_PATH = process.env.IELTS_DB_PATH ?? path.join(process.cwd(), "app.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS prompts (
    id          INTEGER PRIMARY KEY,
    type        TEXT NOT NULL,
    category    TEXT,
    text        TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS essays (
    id           INTEGER PRIMARY KEY,
    prompt_id    INTEGER REFERENCES prompts(id),
    body         TEXT NOT NULL,
    word_count   INTEGER,
    time_taken_s INTEGER,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessments (
    id            INTEGER PRIMARY KEY,
    essay_id      INTEGER REFERENCES essays(id),
    band_tr       REAL,
    band_cc       REAL,
    band_lr       REAL,
    band_gra      REAL,
    band_overall  REAL,
    feedback_json TEXT,
    model_used    TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS errors (
    id            INTEGER PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id),
    category      TEXT,
    original      TEXT,
    corrected     TEXT,
    note          TEXT
);

CREATE TABLE IF NOT EXISTS speaking_attempts (
    id            INTEGER PRIMARY KEY,
    prompt_id     INTEGER REFERENCES prompts(id),
    audio_path    TEXT,
    transcript    TEXT,
    duration_s    INTEGER,
    words_per_min REAL,
    filler_count  INTEGER,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assessments_essay ON assessments(essay_id);
CREATE INDEX IF NOT EXISTS idx_errors_assessment ON errors(assessment_id);
`;

function init(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);

  const insert = db.prepare(
    "INSERT OR IGNORE INTO prompts (type, category, text) VALUES (?, ?, ?)",
  );
  db.transaction(() => {
    for (const p of SEED_PROMPTS) insert.run(p.type, p.category, p.text);
  })();

  return db;
}

// Next.js dev reloads modules on every edit; keep one connection per process.
const g = globalThis as unknown as { __ieltsDb?: Database.Database };
export const db: Database.Database = g.__ieltsDb ?? (g.__ieltsDb = init());
