# IELTS Prep Tool

A local-first feedback loop for IELTS Academic Writing Task 2. Draw a prompt,
write against a 40-minute clock, get marked against the four official criteria in
about a minute, and watch the trend.

Single user, no login, no deployment. The database is one file (`app.db`) — back
it up by copying it.

## Setup

```bash
cp .env.local.example .env.local   # pick a provider block, fill in the key
npm run dev                        # http://localhost:3000
```

The marker talks to any **OpenAI-compatible** endpoint, chosen by three env vars
(`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`) — OpenRouter, Groq, Ollama, LM Studio
or vLLM, no code change between them. `.env.local.example` has a ready block for
each.

The schema is created and the prompt list seeded automatically on first boot.

## What's here (MVP / P0)

- **Home** (`/`) — latest band against the 7.0 target, this week's essays against
  the 3-a-week goal, total against the 20-before-the-exam goal, the three error
  categories costing you the most, and your recent essays.
- **Write** (`/write`) — a replica of the computer-delivered test screen: split panes
  with a draggable divider, the official task wording, the countdown in the
  header with warnings at 10 and 5 minutes, and a live word count in the footer.
  Fixed light theme, no app navigation and no spell-check — what you practise on
  is what you sit in front of on the day. The draft survives a refresh
  (`localStorage`), so a stray reload can't cost you 40 minutes.
- **Marking** — the essay goes to Claude with the band descriptors in context.
  The model must quote your own sentences as evidence before awarding each band,
  is instructed to mark strictly and to round *down* when torn, and returns a
  schema-validated JSON object (structured outputs, so a malformed response is
  impossible rather than merely unlikely).
- **Essays** (`/essays`) — every essay with its bands. Re-mark any essay; each
  marking is kept, so nothing is overwritten.
- **Progress** (`/stats`) — overall band trend, one small chart per criterion,
  and a running count of your recurring error categories.

## Calibration — does it inflate?

```bash
npm run calibrate     # needs the app running
```

Marks the two official IELTS sample Task 2 responses — the ones real examiners
awarded **band 5.5** and **band 7.5** — and prints the gap. Two LLM calls, writes
nothing to the database, and it is the only free ground truth available.

Run it once when you first pick a model, and again if you switch models. A mean
delta of +0.5 or more means the model is flattering you: subtract that much from
every band it gives you. Above +1.0, ignore its bands entirely and use only the
corrections. The fixture lives in `src/lib/calibration.ts`; the source PDF is in
`resources/` (gitignored — download it again from ielts.org if you need it).

One caveat baked into the fixture: the official PDF prints the responses but not
the question, so the prompt is reconstructed. Weigh a Task Response gap less
heavily than a gap on the other three criteria.

## Read this before trusting a score

**Model size shows up directly in marking quality.** This is the one place in the
project where the cheap option costs you something real: a 7–14B local model will
happily invent evidence, miss agreement errors, and hand out band 7.5 to a band 6
essay. If you run local, treat the corrections as useful and the band as noise. A
hosted open-weight model (DeepSeek, Qwen, Llama 70B) costs about a tenth of a cent
per essay and is far closer to usable.

**An LLM band score is not an examiner band score.** Use it as a compass — am I
improving, what do I keep getting wrong — not as an absolute measure. Before the
real exam, have a human tutor mark 3–4 of these essays so you know how far above
or below reality this thing scores.

**`src/lib/descriptors.ts` holds the official text** — the Task 2 table from
IELTS's *Writing Band Descriptors*, updated May 2023, extracted from the PDF at
`ielts.org/cdn/Guides/ielts-writing-band-descriptors.pdf`. Bands 9 down to 4 only:
bands 3 and below describe responses far below anything you will produce, and
every token here is sent on every marking call.

## Deliberately not built

No accounts, no payments, no Listening/Reading modules, no question bank of
copied past papers, no deployment, no mobile layout. If a feature doesn't raise
the score, it's out.

**P1 — only after two weeks of real use:** speaking practice (Part 2 cue card →
record → transcript → fluency metrics) and a dedicated error-log view. The
`speaking_attempts` table and the 8 seeded cue cards are already in place; the
error rows are already being written on every marking, so `/stats` shows the
category counts today.

## Stack

Next.js (App Router) · SQLite via better-sqlite3 · any OpenAI-compatible LLM
endpoint, with the reply validated against a Zod schema · Tailwind. No build step
beyond Next, no server to install, no container.

The marker tries `response_format: json_schema` first, falls back to `json_object`,
then to plain text — small local models support none of the three — and strips
markdown fences before validating. Band scores are snapped to the half-band grid
in code, and the overall band is computed from the official rounding rule rather
than asked of the model.

## Layout

```
src/lib/db.ts             schema + seed, one connection per process
src/lib/calibration.ts    official examiner-marked essays, used by npm run calibrate
src/lib/seed-prompts.ts   32 Task 2 prompts (30 original + 2 official) + 8 cue cards
src/lib/descriptors.ts    the official May 2023 Task 2 band descriptors
src/lib/assess.ts         the marking prompt, schema, and overall-band arithmetic
src/app/api/...           prompts/random · essays · essays/[id]/assess · stats
```

## Reference PDFs

`resources/` holds every official IELTS document this project was built from — 30
PDFs, gitignored. Re-download them all at any time:

```bash
npm run resources
```

| Folder | What's in it |
|---|---|
| `guides/` | Writing band descriptors (May 2023) — the source of `src/lib/descriptors.ts` — and the Speaking descriptors, for the P1 module |
| `academic-writing/` | Examiner-marked sample responses (the calibration set) and the 2023 sample tasks (2 official Task 2 prompts + the exam wording the UI reproduces) |
| `academic-reading/` | 10 answer keys, one per question type |
| `listening/` | 8 answer keys + 8 full recording transcripts |

`resources/INDEX.md` describes every file, lists the Inspera links for the
interactive tasks (reading passages and listening audio can't be downloaded), and
records the raw-score → band conversion: **30/40 in both Listening and Reading**
for a band 7.

## Sources and attribution

Every piece of IELTS material in this repository comes from the official
preparation resources published free by IELTS, and remains the property of the
IELTS partners (British Council, IDP: IELTS Australia, Cambridge University Press
& Assessment). It is reproduced here for personal exam preparation, with the
source named at the top of each file.

- Sample test questions (Academic) —
  <https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test>
- Writing band descriptors (updated May 2023) —
  <https://ielts.org/cdn/Guides/ielts-writing-band-descriptors.pdf>
  → the Task 2 table, bands 9–4, is reproduced in `src/lib/descriptors.ts`
- Sample candidate writing responses and examiner comments —
  <https://ielts.org/cdn/computer-delivered-sample-tests-academic-writing/ielts-academic-writing-example-responses-to-parts-1-and-2-with-band-scores-and-examiner-comments.pdf>
  → the two examiner-marked Task 2 responses are reproduced in `src/lib/calibration.ts`
- Academic Writing sample tasks (2023) —
  <https://ielts.org/cdn/Sample-tests/ielts-academic-writing-sample-tasks-2023.pdf>
  → 2 of the 32 seeded prompts, and the task wording the exam screen reproduces

The other 30 seeded Task 2 prompts and all 8 speaking cue cards were written for
this project and are not IELTS material.

This is an unofficial personal study tool. It is not affiliated with, endorsed by,
or connected to IELTS in any way, and a band score it produces is not an IELTS
band score.
