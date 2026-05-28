import type { Thesis, ThesisScore } from "./types";
import { scoreThesisHeuristic } from "./heuristic";
import { ThesisScoreSchema } from "./types";

/** @deprecated ScoreContext is unused; scoring is always deterministic. */
export type ScoreContext = Record<string, never>;

/** Deterministic score — same as scoreThesisHeuristic with schema validation. */
export async function scoreThesis(thesis: Thesis): Promise<ThesisScore> {
  return ThesisScoreSchema.parse(scoreThesisHeuristic(thesis));
}

export function scoringModeLabel(): string {
  return "heuristic";
}
