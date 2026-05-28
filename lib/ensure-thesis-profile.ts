import {
  baseThesisRefs,
  enrichScoreWithStoredResearch,
  findThesisByRefAsync,
  loadResearchAsync,
  loadScoreAsync,
  saveScoreAsync,
} from "./data";
import type { RankedThesis } from "./types";
import { runResearch } from "./research";
import { scoreThesisForRanking } from "./score-pipeline";

export function isThesisProfileComplete(row: RankedThesis): boolean {
  const t = row.thesis;
  return !!(
    t?.one_liner?.trim() &&
    t?.wedge?.trim() &&
    t?.example_customer?.trim() &&
    row.technicalSnapshot?.trim() &&
    row.v1Plan?.day3 &&
    row.v1Plan?.week3 &&
    row.v1Plan?.week10 &&
    (row.researchCitations?.length ?? 0) > 0
  );
}

/**
 * Backfill live re-rank ideas missing research or full profile fields.
 * Uses deterministic scoring only (no LLM).
 */
export async function ensureThesisProfile(
  ref: string,
  ranked: RankedThesis
): Promise<RankedThesis> {
  if (baseThesisRefs().has(ref) || isThesisProfileComplete(ranked)) {
    return ranked;
  }

  const thesis = ranked.thesis ?? (await findThesisByRefAsync(ref));
  if (!thesis) return ranked;

  if (!(await loadResearchAsync(ref))) {
    await runResearch(thesis);
  }

  const existing = await loadScoreAsync(ref);
  const enriched = existing
    ? enrichScoreWithStoredResearch(existing)
    : null;

  if (enriched && isThesisProfileComplete({ ...ranked, ...enriched, thesis })) {
    return { ...ranked, ...enriched, thesis };
  }

  const score = await scoreThesisForRanking(thesis);
  await saveScoreAsync(score);
  return { ...ranked, ...score, thesis };
}
