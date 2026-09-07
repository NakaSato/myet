# Official IELTS resources

Downloaded from ielts.org. Reference material for study — **not** wired into the
app, except for the three files marked ✅ below, which the code reads from.

Source page: <https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test>

Re-download everything with `npm run resources`.

---

## guides/ — band descriptors

| File | Notes |
|---|---|
| `ielts-writing-band-descriptors.pdf` | ✅ Task 2 table, bands 9–4, is the source of `src/lib/descriptors.ts`. Updated May 2023. Also contains the full Task 1 table. |
| `ielts-speaking-band-descriptors.pdf` | For the P1 speaking module. Not used yet. |

## academic-writing/

| File | Notes |
|---|---|
| `ielts-academic-writing-example-responses.pdf` | ✅ Two Task 2 responses marked **band 5.5** and **band 7.5** by real examiners, with full comments. Source of `src/lib/calibration.ts` — run `npm run calibrate`. Also has two Task 1 responses (band 6 and band 4). |
| `ielts-academic-writing-sample-tasks-2023.pdf` | ✅ Source of the 2 official Task 2 prompts in the seed, and of the exact instruction wording the exam screen reproduces. 26 pages — also has Task 1 charts and more prompts. |

## academic-reading/ — 10 answer keys

Answer keys only, one per question type: multiple choice (one answer / more than
one), True–False–Not Given, note completion, table completion, matching features,
summary completion (from text / from list), sentence completion, matching sentence
endings.

The passages and questions themselves are **not** downloadable — they live in the
Inspera player (links below). Do the task online, then check against these.

## listening/ — 8 answer keys + 8 tapescripts

Same eight question types, each with an answer key and the **full recording
transcript**. The transcripts are the useful part: do the task online, then read
the tapescript to see exactly what you missed and why.

Audio is not downloadable — it plays inside the Inspera player.

---

## inspera/ — the interactive tasks, extracted

The reading passages, listening questions and writing prompts live in IELTS's
Inspera player, with no file behind them. `npm run inspera` drives a browser
through all 20 and saves the rendered text:

| Folder | What you get |
|---|---|
| `inspera/academic-reading/` | 10 tasks — **the full passages and their questions** (Marie Curie, urban farming, and the rest) |
| `inspera/listening/` | 8 tasks — the question sheets. Audio can't be captured; pair with the tapescripts in `listening/` |
| `inspera/academic-writing/` | Task 1 and Task 2 prompts, with the official instruction wording |

The Task 2 prompt there is the one the examiner-marked sample responses answer,
so it is what `src/lib/calibration.ts` uses:

> The average standard of people's health is likely to be lower in the future
> than it is now. To what extent do you agree or disagree with this statement?

**How to use the reading files:** read the passage and answer the questions from
`inspera/academic-reading/<type>.txt`, then mark yourself against
`academic-reading/<type>-answer-key.pdf`.

---

## Interactive tasks — the original links

Everything above came from these. Open them to do a task with the real timer,
audio, and answer boxes.

**Full practice tests**
- Listening — <https://demo-ielts.inspera.com/player/?assessmentRunId=131012334&context=exam>
- Academic Reading — <https://demo-ielts.inspera.com/player/?assessmentRunId=131013388&context=exam>
- Academic Writing — <https://demo-ielts.inspera.com/player/?assessmentRunId=131013741&context=exam>
- Academic Writing on paper — <https://ielts.inspera.com/player/?assessmentRunId=502166894&context=exam>

**Single Writing tasks**
- Task 1 — <https://ielts.inspera.com/player/?assessmentRunId=205993150&context=exam>
- Task 2 — <https://ielts.inspera.com/player/?assessmentRunId=189733431&context=exam>

**Single Listening tasks** — multiple choice (one) `189697549`, multiple choice
(more than one) `189696950`, plan/map/diagram `189695339`, note completion
`189696078`, table completion `189652254`, flow-chart `189697842`, sentence
completion `189694885`, short answer `189694459`.

**Single Academic Reading tasks** — multiple choice (one) `189731922`, multiple
choice (more than one) `189731586`, T/F/NG `189698592`, note completion
`189731313`, table completion `189698337`, matching features `189732026`, summary
from text `189698831`, summary from list `189699146`, sentence completion
`189731169`, matching sentence endings `189730855`.

Open any of those as `https://ielts.inspera.com/player/?assessmentRunId=<id>&context=exam`.

---

## Band conversion (raw score → band, approximate)

| Band | Listening /40 | Academic Reading /40 |
|---|---|---|
| 5 | 16 | 15 |
| 6 | 23 | 23 |
| 7 | **30** | **30** |
| 8 | 35 | 35 |

Exact thresholds shift slightly per paper. For a 7.0 target: **30/40 in both**.
