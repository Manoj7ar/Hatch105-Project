import { z } from "zod";

export const ThesisSchema = z.object({
  ref: z.string(),
  title: z.string(),
  one_liner: z.string(),
  example_customer: z.string(),
  wedge: z.string(),
});

export type Thesis = z.infer<typeof ThesisSchema>;

export const CRITERION_KEYS = [
  "buildability",
  "speedToRevenue",
  "wedge",
  "distribution",
  "trapRisk",
  "expansion",
] as const;

export type CriterionKey = (typeof CRITERION_KEYS)[number];

export const CriterionScoreSchema = z.object({
  score: z.number().min(1).max(5),
  reason: z.string(),
});

export const V1PlanSchema = z.object({
  day3: z.string(),
  week3: z.string(),
  week10: z.string(),
});

export const ThesisScoreSchema = z.object({
  ref: z.string(),
  title: z.string(),
  criteria: z.object({
    buildability: CriterionScoreSchema,
    speedToRevenue: CriterionScoreSchema,
    wedge: CriterionScoreSchema,
    distribution: CriterionScoreSchema,
    trapRisk: CriterionScoreSchema,
    expansion: CriterionScoreSchema,
  }),
  gatesTriggered: z.array(z.string()),
  fit: z.number(),
  verdict: z.string(),
  scoredWith: z.enum(["heuristic", "groq"]),
  scoredAt: z.string(),
  technicalSnapshot: z.string().optional(),
  v1Plan: V1PlanSchema.optional(),
  trapNote: z.string().optional(),
});

export type ThesisScore = z.infer<typeof ThesisScoreSchema>;

export const RankedThesisSchema = ThesisScoreSchema.extend({
  rank: z.number(),
  thesis: ThesisSchema.optional(),
});

export type RankedThesis = z.infer<typeof RankedThesisSchema>;

export const LlmScoreOutputSchema = z.object({
  buildability: CriterionScoreSchema,
  speedToRevenue: CriterionScoreSchema,
  wedge: CriterionScoreSchema,
  distribution: CriterionScoreSchema,
  trapRisk: CriterionScoreSchema,
  expansion: CriterionScoreSchema,
  verdict: z.string(),
  technicalSnapshot: z.string(),
  v1Plan: V1PlanSchema,
  trapNote: z.string().describe("Use empty string if no trap applies"),
});

export type RankingState = {
  ranked: RankedThesis[];
  executivePick: {
    ref: string;
    title: string;
    fit: number;
    mvp: string;
    trapDemoted: { ref: string; title: string; reason: string };
  };
  top3: RankedThesis[];
  traps: RankedThesis[];
};

/** Normalize legacy score files that used scoredWith: "llm" */
export function normalizeThesisScore(raw: unknown): ThesisScore {
  const obj =
    typeof raw === "object" && raw !== null
      ? {
          ...(raw as Record<string, unknown>),
          scoredWith:
            (raw as { scoredWith?: string }).scoredWith === "llm"
              ? "groq"
              : (raw as { scoredWith?: string }).scoredWith,
        }
      : raw;
  return ThesisScoreSchema.parse(obj);
}
