import type { Thesis, ThesisScore } from "./types";
import { scoreThesis, type ScoreContext } from "./scorer";
import { runResearch, getDefaultResearchMode } from "./research";

/** Research + full-detail Groq score (same depth as curated company profiles). */
export async function scoreThesisForRanking(
  thesis: Thesis,
  ctx?: ScoreContext
): Promise<ThesisScore> {
  const research = await runResearch(thesis, getDefaultResearchMode());
  return scoreThesis(thesis, {
    ...ctx,
    forceGroq: ctx?.forceGroq ?? true,
    fullDetail: true,
    researchCitations: research.citations,
  });
}
