import { generateObject, generateText } from "ai";
import type { z } from "zod";
import type { Thesis, ThesisScore, ResearchCitation } from "./types";
import {
  LlmScoreOutputSchema,
  LlmScorePass1Schema,
  LlmScorePass2Schema,
  ThesisScoreSchema,
} from "./types";
import { applyHardGates, applyCapsToCriteria, applyGateFitCeiling } from "./gates";
import { computeFit, verdictFromFit } from "./criteria";
import { scoreThesisHeuristic } from "./heuristic";
import { getGroqModel } from "./models";
import {
  buildScoreThesisPrompt,
  citationsToSnippets,
  type ScorePromptExtras,
} from "./prompts/score-thesis";
import { CRITERIA_VERSION } from "./criteria-version";
import { matchCompetitorsInText, formatCompetitorBlock } from "./competitors";
import { checkShopifySurfaces, formatSurfaceFlagsBlock } from "./shopify-surfaces";

type LlmOutput = z.infer<typeof LlmScoreOutputSchema>;
type Pass1 = z.infer<typeof LlmScorePass1Schema>;

export type ScoringMode = "auto" | "heuristic" | "groq";
export type ScoringRouting = "smart" | "always_groq";

export type ScoreContext = {
  forceGroq?: boolean;
  twoPass?: boolean;
  fullDetail?: boolean;
  researchCitations?: ResearchCitation[];
};

export function getScoringMode(): ScoringMode {
  const mode = (process.env.SCORING_MODE ?? "auto").toLowerCase();
  if (mode === "heuristic" || mode === "groq") return mode;
  return "auto";
}

export function getScoringRouting(): ScoringRouting {
  const r = (process.env.SCORING_ROUTING ?? "smart").toLowerCase();
  return r === "always_groq" ? "always_groq" : "smart";
}

export function useGroqScoring(): boolean {
  const mode = getScoringMode();
  if (mode === "heuristic") return false;
  if (mode === "groq") return !!process.env.GROQ_API_KEY;
  return !!process.env.GROQ_API_KEY;
}

export function shouldUseGroqForFit(
  heuristicFit: number,
  ref: string,
  forceGroq?: boolean
): boolean {
  if (!useGroqScoring()) return false;
  if (forceGroq) return true;
  if (getScoringRouting() === "always_groq") return true;
  const always = (process.env.GROQ_ALWAYS_REFS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (always.includes(ref)) return true;
  return heuristicFit >= 3.2 && heuristicFit <= 3.8;
}

export function useTwoPassScoring(): boolean {
  return process.env.SCORING_TWO_PASS === "1" || process.env.SCORING_TWO_PASS === "true";
}

export function scoringModeLabel(): string {
  return useGroqScoring() ? "groq" : "heuristic";
}

function promptExtras(thesis: Thesis, ctx?: ScoreContext): ScorePromptExtras {
  const blob = `${thesis.wedge} ${thesis.one_liner}`;
  const competitors = matchCompetitorsInText(blob);
  const surfaceFlags = checkShopifySurfaces(thesis);
  return {
    competitorBlock: formatCompetitorBlock(competitors),
    surfaceBlock: formatSurfaceFlagsBlock(surfaceFlags),
    researchSnippets: ctx?.researchCitations
      ? citationsToSnippets(ctx.researchCitations)
      : undefined,
  };
}

export async function scoreThesis(
  thesis: Thesis,
  ctx?: ScoreContext
): Promise<ThesisScore> {
  const surfaceFlags = checkShopifySurfaces(thesis);
  const heuristicBase = scoreThesisHeuristic(thesis);
  const heuristicFit = heuristicBase.fit;

  const runGroq =
    ctx?.forceGroq ||
    (useGroqScoring() && shouldUseGroqForFit(heuristicFit, thesis.ref, ctx?.forceGroq));

  if (runGroq) {
    try {
      const twoPass = ctx?.twoPass ?? useTwoPassScoring();
      const fullDetail = ctx?.fullDetail ?? !twoPass;
      return await scoreThesisGroq(thesis, {
        ...ctx,
        twoPass,
        fullDetail,
        surfaceFlags,
      });
    } catch (err) {
      console.warn(
        `[scorer] Groq failed for ${thesis.ref}, falling back to heuristic:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return ThesisScoreSchema.parse({
    ...heuristicBase,
    surfaceFlags: surfaceFlags.length ? surfaceFlags : undefined,
    researchCitations: ctx?.researchCitations,
  });
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

async function callGroqSchema<T extends z.ZodTypeAny>(
  thesis: Thesis,
  schema: T,
  extras: ScorePromptExtras
): Promise<z.infer<T>> {
  const model = getGroqModel("scoring");
  const prompt = buildScoreThesisPrompt(thesis, extras);

  try {
    const result = await generateObject({
      model,
      schema,
      temperature: 0,
      prompt,
    });
    return result.object as z.infer<T>;
  } catch (structuredErr) {
    console.warn(
      `[scorer] generateObject failed for ${thesis.ref}:`,
      structuredErr instanceof Error ? structuredErr.message : structuredErr
    );
    const { text } = await generateText({
      model,
      temperature: 0,
      prompt: `${prompt}\n\nRespond with a single JSON object only, no markdown.`,
    });
    return schema.parse(extractJsonObject(text)) as z.infer<T>;
  }
}

function buildScoreFromPass1(
  thesis: Thesis,
  object: Pass1,
  surfaceFlags: ReturnType<typeof checkShopifySurfaces>,
  researchCitations?: ResearchCitation[],
  pass2?: z.infer<typeof LlmScorePass2Schema>
): ThesisScore {
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

  const fit = applyGateFitCeiling(computeFit(criteria), gatesTriggered);
  const verdict = verdictFromFit(fit);
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
    criteriaVersion: CRITERIA_VERSION,
    technicalSnapshot: pass2?.technicalSnapshot,
    v1Plan: pass2?.v1Plan,
    trapNote: trapNote && trapNote.length > 0 ? trapNote : undefined,
    surfaceFlags: surfaceFlags.length ? surfaceFlags : undefined,
    researchCitations,
  });
}

async function scoreThesisGroq(
  thesis: Thesis,
  ctx: ScoreContext & {
    twoPass?: boolean;
    fullDetail?: boolean;
    surfaceFlags: ReturnType<typeof checkShopifySurfaces>;
  }
): Promise<ThesisScore> {
  const extras = promptExtras(thesis, ctx);
  const researchCitations = ctx.researchCitations;

  if (ctx.twoPass && !ctx.fullDetail) {
    const pass1 = await callGroqSchema(thesis, LlmScorePass1Schema, {
      ...extras,
      pass: 1,
    });
    const topDetailLimit = Number(process.env.SCORING_TOP_DETAIL ?? "15");
    const heuristic = scoreThesisHeuristic(thesis);
    const needsPass2 =
      ctx.fullDetail ||
      heuristic.fit >= 3.5 ||
      process.env.SCORING_PASS2_ALL === "1";

    let pass2: z.infer<typeof LlmScorePass2Schema> | undefined;
    if (needsPass2) {
      pass2 = await callGroqSchema(thesis, LlmScorePass2Schema, {
        ...extras,
        pass: 2,
        pass1Json: JSON.stringify(pass1, null, 2),
      });
    }

    return buildScoreFromPass1(
      thesis,
      pass1,
      ctx.surfaceFlags,
      researchCitations,
      pass2
    );
  }

  const object = await callGroqSchema(thesis, LlmScoreOutputSchema, extras);
  return buildScoreFromPass1(
    thesis,
    object,
    ctx.surfaceFlags,
    researchCitations,
    { technicalSnapshot: object.technicalSnapshot, v1Plan: object.v1Plan }
  );
}

export async function scoreThesisWithContext(
  thesis: Thesis,
  ctx: ScoreContext
): Promise<ThesisScore> {
  return scoreThesis(thesis, { ...ctx, forceGroq: true });
}
