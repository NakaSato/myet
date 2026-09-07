import OpenAI from "openai";
import { z } from "zod";
import { TASK2_DESCRIPTORS } from "./descriptors";
import { getSettings, llmConfigError } from "./settings";

export { llmConfigError };

/**
 * Any OpenAI-compatible endpoint. Verified shapes:
 *   OpenRouter  https://openrouter.ai/api/v1   (open-weight models, ~$0.001/essay)
 *   Ollama      http://localhost:11434/v1      (fully local, free, no key)
 *   LM Studio   http://localhost:1234/v1       (fully local, free, no key)
 *   Groq        https://api.groq.com/openai/v1 (free tier, open-weight models)
 * Configured on the Settings page, or by env var before anything is saved.
 * Read per call, so a change takes effect without a restart.
 */
export function llm() {
  const s = getSettings();
  return { baseURL: s.llm_base_url, apiKey: s.llm_api_key || "not-needed", model: s.llm_model };
}

const ERROR_CATEGORIES = [
  "article",
  "tense",
  "sva",
  "preposition",
  "collocation",
  "word_form",
  "word_choice",
  "punctuation",
  "word_order",
  "other",
] as const;

const Criterion = z.object({
  band: z.number().describe("Band score between 1 and 9, in steps of 0.5."),
  evidence: z
    .string()
    .describe(
      "One or two sentences quoted verbatim from the essay that justify this band, then why they justify it.",
    ),
  how_to_improve: z
    .string()
    .describe("The single most useful change to move up half a band on this criterion."),
});

export const AssessmentSchema = z.object({
  task_response: Criterion,
  coherence_cohesion: Criterion,
  lexical_resource: Criterion,
  grammatical_range: Criterion,
  corrections: z
    .array(
      z.object({
        original: z.string().describe("The incorrect sentence or clause, quoted verbatim."),
        corrected: z.string().describe("The same sentence rewritten correctly."),
        category: z.enum(ERROR_CATEGORIES),
        why: z.string().describe("One short sentence naming the rule that was broken."),
      }),
    )
    .describe("The 5 to 12 most damaging errors, highest-impact first."),
  top_priority: z.string().describe("One sentence: the single most important thing to fix first."),
});

export type Assessment = z.infer<typeof AssessmentSchema>;

const JSON_SCHEMA = (() => {
  const s = z.toJSONSchema(AssessmentSchema) as Record<string, unknown>;
  delete s.$schema; // strict json_schema mode rejects unknown top-level keys on some providers
  return s;
})();

const SYSTEM = `You are a senior IELTS Academic examiner with fifteen years of experience marking Writing Task 2. You mark to the official band descriptors, reproduced in full below.

${TASK2_DESCRIPTORS}

HOW TO MARK

1. Read the whole essay before scoring anything.
2. For every criterion, quote real text from the essay as evidence BEFORE deciding the band. Never award a band you cannot point at a sentence to justify. Quote verbatim — do not paraphrase the candidate's words.
3. Mark strictly, to the standard of a real test centre. Automated markers are known to inflate IELTS scores; you must not. When you are torn between two bands, award the LOWER one. A competent, organised essay with a mix of accurate and inaccurate complex sentences is a band 6.0–6.5, not a 7.5. Bands 8 and 9 are rare and require near-flawless control.
4. Apply the word-count penalty: an essay under 250 words cannot score above 5 for Task Response.
5. Bands are whole or half steps only (5.0, 5.5, 6.0, 6.5, 7.0 …).
6. In "corrections", give the errors that cost the most marks, not every typo. Prefer recurring patterns over one-off slips, and classify each one honestly.
7. "how_to_improve" must be concrete and actionable for this specific essay — never generic advice like "use more linking words".

Reply with a single JSON object and nothing else. No markdown fences, no preamble, no commentary.

Be direct. The candidate is preparing for a real exam and a flattering score actively harms them.`;

/** Weaker models drift off the half-band grid; the grid is not negotiable. */
function snapBand(n: number): number {
  return Math.min(9, Math.max(1, Math.round(n * 2) / 2));
}

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = (fenced ? fenced[1] : raw).trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in the model's reply.");
  return JSON.parse(text.slice(start, end + 1));
}

type ResponseFormat =
  | NonNullable<
      OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming["response_format"]
    >
  | undefined;

// Best-supported first. Small local models often support none of them.
const FORMATS: ResponseFormat[] = [
  {
    type: "json_schema",
    json_schema: { name: "ielts_assessment", strict: true, schema: JSON_SCHEMA },
  },
  { type: "json_object" },
  undefined,
];

export type AssessInput = { promptText: string; body: string; wordCount: number };

export async function assessEssay({ promptText, body, wordCount }: AssessInput) {
  const configError = llmConfigError();
  if (configError) throw new Error(configError);

  const LLM = llm();
  const client = new OpenAI({
    baseURL: LLM.baseURL,
    apiKey: LLM.apiKey,
    defaultHeaders: { "X-Title": "IELTS Prep Tool" }, // shows up in the OpenRouter dashboard
  });

  const userMessage = `TASK 2 QUESTION:\n${promptText}\n\nCANDIDATE'S ESSAY (${wordCount} words):\n${body}`;

  let lastError: unknown;

  for (const response_format of FORMATS) {
    let completion;
    try {
      completion = await client.chat.completions.create({
        model: LLM.model,
        temperature: 0,
        max_tokens: 8000,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMessage },
        ],
        ...(response_format ? { response_format } : {}),
      });
    } catch (err) {
      // Provider rejected this response_format — fall through to the next one.
      lastError = err;
      continue;
    }

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      lastError = new Error("The model returned an empty reply.");
      continue;
    }

    try {
      const parsed = AssessmentSchema.parse(extractJson(raw));
      for (const c of [
        parsed.task_response,
        parsed.coherence_cohesion,
        parsed.lexical_resource,
        parsed.grammatical_range,
      ]) {
        c.band = snapBand(c.band);
      }
      return { assessment: parsed, usage: completion.usage, model: LLM.model };
    } catch (err) {
      lastError = err;
    }
  }

  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `${LLM.model} did not return a usable assessment. Smaller models often can't hold this schema — try a larger one. (${detail})`,
  );
}

/**
 * IELTS overall band = mean of the four criteria, rounded to the nearest half
 * band; .25 rounds up to .5 and .75 up to the next whole band. Computed here
 * rather than asked of the model — it is arithmetic, not judgement.
 */
export function overallBand(a: Assessment): number {
  const mean =
    (a.task_response.band +
      a.coherence_cohesion.band +
      a.lexical_resource.band +
      a.grammatical_range.band) /
    4;
  return Math.round(mean * 2) / 2;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
