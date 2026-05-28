import type { Thesis, ThesisScore } from "./types";
import { scoreThesisHeuristic } from "./heuristic";
import { runResearch, getDefaultResearchMode } from "./research";
import { ThesisScoreSchema } from "./types";

/** Grounded research + deterministic heuristic score (no LLM). */
export async function scoreThesisForRanking(thesis: Thesis): Promise<ThesisScore> {
  const research = await runResearch(thesis, getDefaultResearchMode());
  const score = scoreThesisHeuristic(thesis);
  return ThesisScoreSchema.parse({
    ...score,
    researchCitations: research.citations,
  });
}
