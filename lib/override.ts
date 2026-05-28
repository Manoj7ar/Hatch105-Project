import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { z } from "zod";
import type { CriterionKey, ThesisScore } from "./types";
import { CRITERION_KEYS, CriterionScoreSchema } from "./types";
import { computeFit, verdictFromFit } from "./criteria";

const OVERRIDES_DIR = join(process.cwd(), "overrides");

const CriterionPatchSchema = z.object({
  score: z.number().min(1).max(5).optional(),
  reason: z.string().optional(),
  evidence: z.enum(["sourced", "inferred", "guess"]).optional(),
});

const CriterionPatchesSchema = z
  .object({
    buildability: CriterionPatchSchema.optional(),
    speedToRevenue: CriterionPatchSchema.optional(),
    wedge: CriterionPatchSchema.optional(),
    distribution: CriterionPatchSchema.optional(),
    trapRisk: CriterionPatchSchema.optional(),
    expansion: CriterionPatchSchema.optional(),
  })
  .optional();

export const OverrideRecordSchema = z.object({
  ref: z.string(),
  note: z.string(),
  author: z.string().optional(),
  at: z.string(),
  criterionPatches: CriterionPatchesSchema,
  fitOverride: z.number().optional(),
  history: z
    .array(
      z.object({
        at: z.string(),
        note: z.string(),
        author: z.string().optional(),
        action: z.string(),
      })
    )
    .optional(),
});

export type OverrideRecord = z.infer<typeof OverrideRecordSchema>;

export function overridePath(ref: string) {
  return join(OVERRIDES_DIR, `${ref}.json`);
}

export function loadOverride(ref: string): OverrideRecord | null {
  const p = overridePath(ref);
  if (!existsSync(p)) return null;
  return OverrideRecordSchema.parse(JSON.parse(readFileSync(p, "utf-8")));
}

export function saveOverride(record: OverrideRecord) {
  if (!existsSync(OVERRIDES_DIR)) mkdirSync(OVERRIDES_DIR, { recursive: true });
  writeFileSync(overridePath(record.ref), JSON.stringify(record, null, 2));
}

export function deleteOverride(ref: string): void {
  const p = overridePath(ref);
  if (!existsSync(p)) return;
  try {
    unlinkSync(p);
  } catch {
    /* skip */
  }
}

export function applyOverrideToScore(
  base: ThesisScore,
  override: OverrideRecord | null
): ThesisScore {
  if (!override) return base;

  const criteria = { ...base.criteria };
  if (override.criterionPatches) {
    for (const key of CRITERION_KEYS) {
      const patch = override.criterionPatches[key];
      if (!patch) continue;
      const cur = criteria[key];
      criteria[key] = CriterionScoreSchema.parse({
        score: patch.score ?? cur.score,
        reason: patch.reason ?? cur.reason,
        evidence: patch.evidence ?? cur.evidence,
      });
    }
  }

  const fit =
    override.fitOverride ?? computeFit(criteria);
  const verdict = verdictFromFit(fit);

  const scoredWith =
    base.scoredWith === "heuristic" || base.scoredWith === "groq"
      ? ("human+groq" as const)
      : base.scoredWith;

  return {
    ...base,
    criteria,
    fit,
    verdict,
    scoredWith,
    overrideNote: override.note,
    overrideAt: override.at,
  };
}

export function appendOverrideHistory(
  record: OverrideRecord,
  action: string,
  note: string,
  author?: string
): OverrideRecord {
  const entry = {
    at: new Date().toISOString(),
    note,
    author,
    action,
  };
  return {
    ...record,
    history: [...(record.history ?? []), entry],
  };
}
