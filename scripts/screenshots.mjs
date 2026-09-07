#!/usr/bin/env node
/**
 * Regenerates the README screenshots.
 *
 * Drives a real browser against a running app, so the exam screen is captured
 * mid-essay with the clock going — not as an empty start screen.
 *
 *   npm run screenshots            (needs the app running, and a marked essay)
 */
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const OUT = "docs/screenshots";
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const THEME = process.env.THEME ?? "dark";

const SAMPLE = `Traffic jam in the big cities is one of most serious problem in nowadays. In my essay, I will discuss about the main reasons of this situation and suggest some ways to solve it.

Firstly, the primary cause is the rapid growth of population in urban area. Every year, a large number of people moves from countryside to city because they want to find a better job, and this make the road become more crowded. Secondly, the price of private car has decreased in the last decade, so almost every family can afford to buy one or two vehicle.`;

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars", "--force-device-scale-factor=2"],
});

async function shot(name, { path, width = 1280, height = 800, prepare }) {
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: THEME }]);
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0" });
  if (prepare) await prepare(page);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  ${OUT}/${name}.png`);
  await page.close();
}

console.log(`Capturing ${THEME} screenshots from ${BASE}`);

await shot("home", { path: "/", height: 900 });

await shot("write", {
  path: "/write",
  height: 800,
  async prepare(page) {
    // Draw a prompt, then type into the answer pane so the screen shows a real attempt.
    await page.evaluate(() => {
      const start = [...document.querySelectorAll("button")].find((b) =>
        /Start|New task/.test(b.textContent),
      );
      start?.click();
    });
    await page.waitForFunction(() => !!document.querySelector("blockquote"), { timeout: 10000 });
    await page.click("textarea");
    await page.evaluate((text) => {
      const ta = document.querySelector("textarea");
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      ).set;
      setter.call(ta, text);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }, SAMPLE);
    // let the countdown move off 40:00
    await new Promise((r) => setTimeout(r, 2500));
  },
});

await shot("review", {
  path: "/essays/1",
  height: 1180,
  async prepare(page) {
    await page.waitForSelector("mark", { timeout: 10000 });
  },
});

await shot("progress", { path: "/stats", height: 900 });

await browser.close();
console.log("done");
