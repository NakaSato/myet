#!/usr/bin/env node
// Marks the official IELTS sample responses and prints the gap vs. the bands
// real examiners awarded. Needs the dev server running (npm run dev).
const BASE = process.env.APP_URL ?? "http://localhost:3000";

const res = await fetch(`${BASE}/api/calibrate`, { method: "POST" }).catch(() => null);
if (!res) {
  console.error(`Could not reach ${BASE}. Start the app first: npm run dev`);
  process.exit(1);
}

const data = await res.json();
if (!res.ok) {
  console.error(`\n  ${data.error}\n`);
  process.exit(1);
}

console.log(`\n  Calibration against official IELTS examiner bands`);
console.log(`  model: ${data.model}  ·  ${data.endpoint}\n`);

for (const r of data.results) {
  if (r.error) {
    console.log(`  ${r.id}\n    FAILED: ${r.error}\n`);
    continue;
  }
  const sign = r.delta > 0 ? "+" : "";
  console.log(`  ${r.id}`);
  console.log(
    `    examiner ${r.official.toFixed(1)}   tool ${r.tool.toFixed(1)}   delta ${sign}${r.delta.toFixed(1)}`,
  );
  const c = r.criteria;
  console.log(
    `    TR ${c.task_response}  CC ${c.coherence_cohesion}  LR ${c.lexical_resource}  GRA ${c.grammatical_range}`,
  );
  console.log(`    "${r.top_priority}"\n`);
}

if (data.mean_delta !== null) {
  const sign = data.mean_delta > 0 ? "+" : "";
  console.log(`  mean delta ${sign}${data.mean_delta}  →  ${data.verdict}\n`);
}
