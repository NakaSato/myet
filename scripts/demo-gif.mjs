#!/usr/bin/env node
/**
 * Records the animated demo in the README: a prompt is drawn, the essay is
 * typed, the clock runs down and the word count climbs toward 250.
 *
 * Drives a real browser and encodes the frames to GIF in pure JS — no ffmpeg.
 *
 *   npm run demo        (needs the app running)
 */
import puppeteer from "puppeteer-core";
import gifenc from "gifenc"; // CommonJS — no named exports
const { GIFEncoder, quantize, applyPalette } = gifenc;
import { PNG } from "pngjs";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "docs/screenshots/demo.gif";
const FRAME_MS = 220;

const ESSAY = `Traffic congestion in large cities is widely seen as one of the most pressing urban problems of our time. In my view, it stems mainly from rapid urbanisation and falling car ownership costs, and it can only be solved by making public transport a genuinely attractive alternative rather than a last resort.

The primary cause is the speed at which cities have grown. Every year large numbers of people move from rural areas to urban centres in search of better paid work, and the road network simply cannot absorb them.`;

// Type in word groups: fast enough to stay under a few seconds, slow enough to read.
function steps(text, n) {
  const words = text.split(" ");
  const out = [];
  for (let i = 1; i <= n; i++) out.push(words.slice(0, Math.ceil((words.length * i) / n)).join(" "));
  return out;
}

await mkdir("docs/screenshots", { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1180, height: 680, deviceScaleFactor: 0.85 });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
await page.goto(`${BASE}/write`, { waitUntil: "networkidle0" });

// Start the attempt.
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => /Start|New task/.test(b.textContent))?.click();
});
await page.waitForFunction(() => !!document.querySelector("blockquote"), { timeout: 15000 });
await page.click("textarea");
// The focus ring is correct in the app but distracting in a looping demo.
await page.addStyleTag({ content: "textarea:focus,textarea:focus-visible{outline:none!important}" });

const setValue = (text) =>
  page.evaluate((t) => {
    const ta = document.querySelector("textarea");
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set.call(ta, t);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.scrollTop = ta.scrollHeight;
  }, text);

const frames = [];
const grab = async () => frames.push(PNG.sync.read(await page.screenshot({ type: "png" })));

console.log("recording…");
await grab();
await grab(); // hold on the empty page for a beat
for (const partial of steps(ESSAY, 26)) {
  await setValue(partial);
  await grab();
}
for (let i = 0; i < 5; i++) await grab(); // hold on the finished frame

console.log(`encoding ${frames.length} frames…`);
// One palette for every frame — the UI is nearly flat, so this keeps the file small.
const palette = quantize(frames.at(-1).data, 64, { format: "rgb565" });
const gif = GIFEncoder();
for (const f of frames) {
  gif.writeFrame(applyPalette(f.data, palette, "rgb565"), f.width, f.height, {
    palette,
    delay: FRAME_MS,
  });
}
gif.finish();

await writeFile(OUT, gif.bytes());
await browser.close();

const { size } = await import("node:fs").then((fs) => fs.promises.stat(OUT));
console.log(`${OUT}  ${frames[0].width}×${frames[0].height}  ${(size / 1024).toFixed(0)} KB`);
