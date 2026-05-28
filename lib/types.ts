import { z } from "zod";
import { CRITERIA_VERSION } from "./criteria-version";

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

export const EvidenceTagSchema = z.enum(["sourced", "inferred", "guess"]);
export type EvidenceTag = z.infer<typeof EvidenceTagSchema>;

export const CriterionScoreSchema = z.object({
  score: z.number().min(1).max(5),
  reason: z.string(),
  evidence: EvidenceTagSchema.default("inferred"),
});

export const V1PlanSchema = z.object({
  day3: z.string(),
  week3: z.string(),
  week10: z.string(),
});

export const SurfaceFlagSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: z.enum(["info", "warning", "error"]),
});

export const ResearchCitationSchema = z.object({
  index: z.number(),
  title: z.string(),
  url: z.string().optional(),
  snippet: z.string(),
  source: z.enum(["grounded", "external", "thesis"]),
});

export type ResearchCitation = z.infer<typeof ResearchCitationSchema>;

export const ScoredWithSchema = z.enum([
  "heuristic",
  "groq",
  "gemini",
  "human+heuristic",
  "human+groq",
  "human+gemini",
]);

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
  scoredWith: ScoredWithSchema,
  scoredAt: z.string(),
  criteriaVersion: z.string().default(CRITERIA_VERSION),
  technicalSnapshot: z.string().optional(),
  v1Plan: V1PlanSchema.optional(),
  trapNote: z.string().optional(),
  surfaceFlags: z.array(SurfaceFlagSchema).optional(),
  researchCitations: z.array(ResearchCitationSchema).optional(),
  overrideNote: z.string().optional(),
  overrideAt: z.string().optional(),
});

export type ThesisScore = z.infer<typeof ThesisScoreSchema>;

export const RankedThesisSchema = ThesisScoreSchema.extend({
  rank: z.number(),
  thesis: ThesisSchema.optional(),
});

export type RankedThesis = z.infer<typeof RankedThesisSchema>;

export const LlmCriterionScoreSchema = z.object({
  score: z.number().min(1).max(5),
  reason: z.string(),
  evidence: EvidenceTagSchema,
});

export const LlmScorePass1Schema = z.object({
  buildability: LlmCriterionScoreSchema,
  speedToRevenue: LlmCriterionScoreSchema,
  wedge: LlmCriterionScoreSchema,
  distribution: LlmCriterionScoreSchema,
  trapRisk: LlmCriterionScoreSchema,
  expansion: LlmCriterionScoreSchema,
  verdict: z.string(),
  trapNote: z.string().describe("Use empty string if no trap applies"),
});

export const LlmScorePass2Schema = z.object({
  technicalSnapshot: z.string(),
  v1Plan: V1PlanSchema,
});

/** Full single-pass output (legacy / forced full detail) */
export const LlmScoreOutputSchema = LlmScorePass1Schema.extend({
  technicalSnapshot: z.string(),
  v1Plan: V1PlanSchema,
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

function withDefaultEvidence(
  criteria: Record<string, unknown>
): Record<string, { score: number; reason: string; evidence: EvidenceTag }> {
  const out: Record<string, { score: number; reason: string; evidence: EvidenceTag }> =
    {};
  for (const key of CRITERION_KEYS) {
    const c = criteria[key] as
      | { score: number; reason: string; evidence?: EvidenceTag }
      | undefined;
    if (!c) continue;
    out[key] = {
      score: c.score,
      reason: c.reason,
      evidence: c.evidence ?? "inferred",
    };
  }
  return out as Record<CriterionKey, { score: number; reason: string; evidence: EvidenceTag }>;
}

/** Normalize legacy score files */
export function normalizeThesisScore(raw: unknown): ThesisScore {
  const base =
    typeof raw === "object" && raw !== null
      ? { ...(raw as Record<string, unknown>) }
      : {};

  const scoredWithRaw = (base.scoredWith as string) ?? "heuristic";
  const scoredWith =
    scoredWithRaw === "llm"
      ? "gemini"
      : scoredWithRaw === "human+heuristic"
        ? "human+heuristic"
        : scoredWithRaw === "human+groq"
          ? "human+groq"
          : scoredWithRaw === "human+gemini"
            ? "human+gemini"
            : scoredWithRaw === "groq"
              ? "groq"
              : scoredWithRaw === "gemini"
                ? "gemini"
                : "heuristic";

  if (typeof base.criteria === "object" && base.criteria !== null) {
    base.criteria = withDefaultEvidence(
      base.criteria as Record<string, unknown>
    );
  }

  base.scoredWith = scoredWith;
  if (!base.criteriaVersion) {
    base.criteriaVersion = CRITERIA_VERSION;
  }

  return ThesisScoreSchema.parse(base);
}
