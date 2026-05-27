import { generateObject, generateText } from "ai";
import type { z } from "zod";
import type { Thesis, ThesisScore } from "./types";
import { LlmScoreOutputSchema, ThesisScoreSchema } from "./types";
import { applyHardGates, applyCapsToCriteria } from "./gates";
import { computeFit, verdictFromFit } from "./criteria";
import { scoreThesisHeuristic } from "./heuristic";
import { getScoringModel } from "./models";
import { buildScoreThesisPrompt } from "./prompts/score-thesis";

type LlmOutput = z.infer<typeof LlmScoreOutputSchema>;

export type ScoringMode = "auto" | "heuristic" | "groq";

export function getScoringMode(): ScoringMode {
  const mode = (process.env.SCORING_MODE ?? "auto").toLowerCase();
  if (mode === "heuristic" || mode === "groq") return mode;
  return "auto";
}

export function useGroqScoring(): boolean {
  const mode = getScoringMode();
  if (mode === "heuristic") return false;
  if (mode === "groq") return !!process.env.GROQ_API_KEY;
  return !!process.env.GROQ_API_KEY;
}

export function scoringModeLabel(): string {
  return useGroqScoring() ? "groq" : "heuristic";
}

export async function scoreThesis(thesis: Thesis): Promise<ThesisScore> {
  if (useGroqScoring()) {
    try {
      return await scoreThesisGroq(thesis);
    } catch (err) {
      console.warn(
        `[scorer] Groq failed for ${thesis.ref}, falling back to heuristic:`,
        err instanceof Error ? err.message : err
      );
    }
  }
  return ThesisScoreSchema.parse(scoreThesisHeuristic(thesis));
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in response");
  return JSON.parse(candidate.slice(start, end + 1));
}

async function callGroqObject(thesis: Thesis): Promise<LlmOutput> {
  const model = getScoringModel();
  const prompt = buildScoreThesisPrompt(thesis);

  try {
    const result = await generateObject({
      model,
      schema: LlmScoreOutputSchema,
      temperature: 0,
      prompt,
    });
    return result.object;
  } catch (structuredErr) {
    console.warn(
      `[scorer] generateObject failed for ${thesis.ref}, trying generateText+JSON:`,
      structuredErr instanceof Error ? structuredErr.message : structuredErr
    );
    const { text } = await generateText({
      model,
      temperature: 0,
      prompt: `${prompt}\n\nRespond with a single JSON object only, no markdown.`,
    });
    return LlmScoreOutputSchema.parse(extractJsonObject(text));
  }
}

async function scoreThesisGroq(thesis: Thesis): Promise<ThesisScore> {
  const object = await callGroqObject(thesis);

  const { gatesTriggered, caps } = applyHardGates(thesis);
  const criteria = applyCapsToCriteria(
    {
      buildability: object.buildability,
      speedToRevenue: object.speedToRevenue,
      wedge: object.wedge,
      distribution: object.distribution,
      trapRisk: object.trapRisk,
      expansion: object.expansion,
    },
    caps,
    gatesTriggered
  );

  const fit = computeFit(criteria);
  const verdict = object.verdict || verdictFromFit(fit);
  const trapNote =
    object.trapNote?.trim() ||
    (gatesTriggered.length > 0
      ? `Hard gates triggered: ${gatesTriggered.join(", ")}`
      : undefined);

  return ThesisScoreSchema.parse({
    ref: thesis.ref,
    title: thesis.title,
    criteria,
    gatesTriggered,
    fit,
    verdict,
    scoredWith: "groq",
    scoredAt: new Date().toISOString(),
    technicalSnapshot: object.technicalSnapshot,
    v1Plan: object.v1Plan,
    trapNote: trapNote && trapNote.length > 0 ? trapNote : undefined,
  });
}
