#!/usr/bin/env node
/**
 * Extracts the text of the official IELTS sample tasks from IELTS's Inspera
 * player into resources/inspera/.
 *
 * These tasks are browser-only — there is no PDF behind them — so the reading
 * passages, listening questions and writing prompts have to be read out of the
 * rendered page. Audio still can't be captured; the tapescripts in
 * resources/listening/ cover that.
 *
 *   npm run inspera
 */
import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";

const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "resources/inspera";
const player = (id) => `https://ielts.inspera.com/player/?assessmentRunId=${id}&context=exam`;

const TASKS = [
  ["academic-writing", "task-1", "205993150"],
  ["academic-writing", "task-2", "189733431"],
  ["academic-reading", "multiple-choice-one-answer", "189731922"],
  ["academic-reading", "multiple-choice-more-than-one-answer", "189731586"],
  ["academic-reading", "identifying-information-true-false-not-given", "189698592"],
  ["academic-reading", "note-completion", "189731313"],
  ["academic-reading", "table-completion", "189698337"],
  ["academic-reading", "matching-features", "189732026"],
  ["academic-reading", "summary-completion-from-text", "189698831"],
  ["academic-reading", "summary-completion-from-list", "189699146"],
  ["academic-reading", "sentence-completion", "189731169"],
  ["academic-reading", "matching-sentence-endings", "189730855"],
  ["listening", "multiple-choice-one-answer", "189697549"],
  ["listening", "multiple-choice-more-than-one-answer", "189696950"],
  ["listening", "plan-map-diagram-labelling", "189695339"],
  ["listening", "note-completion", "189696078"],
  ["listening", "table-completion", "189652254"],
  ["listening", "flow-chart-completion", "189697842"],
  ["listening", "sentence-completion", "189694885"],
  ["listening", "short-answer", "189694459"],
];

// Player chrome that isn't part of the task.
const NOISE = /^(Connected|Messages|Options|Test taker ID|Words: \d+|Reconnecting.*)$/;

const clean = (raw) =>
  raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l, i, a) => !NOISE.test(l) && !(l === "" && a[i - 1] === ""))
    .join("\n")
    .trim();

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars"],
});

const index = [];
for (const [section, name, id] of TASKS) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  let text = "";
  try {
    await page.goto(player(id), { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 8000));
    text = clean(await page.evaluate(() => document.body.innerText));
  } catch (err) {
    text = "";
    console.error(`  FAILED ${section}/${name}: ${err.message}`);
  }
  await page.close();

  if (text.length < 80) {
    console.log(`  skip  ${section}/${name} (${text.length} chars — nothing rendered)`);
    continue;
  }

  await mkdir(`${OUT}/${section}`, { recursive: true });
  const file = `${OUT}/${section}/${name}.txt`;
  await writeFile(
    file,
    `${section} — ${name}\nSource: ${player(id)}\nExtracted from the official IELTS sample task. © IELTS partners.\n\n${"-".repeat(72)}\n\n${text}\n`,
  );
  console.log(`  ok    ${file} (${text.length} chars)`);
  index.push({ section, name, id, chars: text.length });
}

await browser.close();
await writeFile(`${OUT}/index.json`, JSON.stringify(index, null, 2) + "\n");
console.log(`\n${index.length}/${TASKS.length} tasks extracted into ${OUT}`);
