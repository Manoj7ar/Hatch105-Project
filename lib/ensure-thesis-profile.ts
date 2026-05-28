import {
  baseThesisRefs,
  enrichScoreWithStoredResearch,
  findThesisByRef,
  loadResearch,
  loadScore,
  saveScore,
} from "./data";
import type { RankedThesis } from "./types";
import { runResearch } from "./research";
import { scoreThesisForRanking } from "./score-pipeline";

function isProfileComplete(row: RankedThesis): boolean {
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
 * Backfill live re-rank ideas that were scored before the full profile pipeline.
 * Runs grounded research + full Groq score once when a detail page is opened.
 */
export async function ensureThesisProfile(
  ref: string,
  ranked: RankedThesis
): Promise<RankedThesis> {
  if (baseThesisRefs().has(ref) || isProfileComplete(ranked)) {
    return ranked;
  }

  const thesis = ranked.thesis ?? findThesisByRef(ref);
  if (!thesis) return ranked;

  if (!loadResearch(ref)) {
    await runResearch(thesis);
  }

  const existing = loadScore(ref);
  const enriched = existing
    ? enrichScoreWithStoredResearch(existing)
    : null;

  if (enriched && isProfileComplete({ ...ranked, ...enriched, thesis })) {
    return { ...ranked, ...enriched, thesis };
  }

  if (!process.env.GROQ_API_KEY) {
    return enriched ? { ...ranked, ...enriched, thesis } : ranked;
  }

  const score = await scoreThesisForRanking(thesis);
  saveScore(score);
  return { ...ranked, ...score, thesis };
}
