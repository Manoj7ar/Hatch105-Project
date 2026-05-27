import { CRITERION_KEYS, type CriterionKey, type RankedThesis } from "./types";
import { normalizeThesisRef } from "./idea-path";

export type { normalizeThesisRef } from "./idea-path";
export { ideaPath } from "./idea-path";

export type CohortBenchmarks = {
  count: number;
  medianFit: number;
  meanFit: number;
  criterionAverages: Record<CriterionKey, number>;
  topPick: RankedThesis;
  fits: number[];
};

export function getRankedThesisByRef(
  ref: string,
  ranked: RankedThesis[]
): RankedThesis | null {
  const normalized = normalizeThesisRef(ref);
  return ranked.find((r) => r.ref.toUpperCase() === normalized) ?? null;
}

export function getCohortBenchmarks(ranked: RankedThesis[]): CohortBenchmarks {
  const fits = ranked.map((r) => r.fit).sort((a, b) => a - b);
  const n = fits.length;
  const medianFit =
    n % 2 === 0 ? (fits[n / 2 - 1]! + fits[n / 2]!) / 2 : fits[Math.floor(n / 2)]!;

  const criterionAverages = {} as Record<CriterionKey, number>;
  for (const key of CRITERION_KEYS) {
    const sum = ranked.reduce((acc, r) => acc + r.criteria[key].score, 0);
    criterionAverages[key] = Math.round((sum / n) * 100) / 100;
  }

  return {
    count: n,
    medianFit: Math.round(medianFit * 100) / 100,
    meanFit: Math.round((fits.reduce((a, b) => a + b, 0) / n) * 100) / 100,
    criterionAverages,
    topPick: ranked[0]!,
    fits,
  };
}

export function getFitPercentile(rank: number, total: number): number {
  if (total <= 1) return 100;
  return Math.round(((total - rank + 1) / total) * 100);
}

export function getAdjacentRefs(
  ranked: RankedThesis[],
  ref: string
): { prev: RankedThesis | null; next: RankedThesis | null } {
  const idx = ranked.findIndex((r) => r.ref === ref);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? ranked[idx - 1]! : null,
    next: idx < ranked.length - 1 ? ranked[idx + 1]! : null,
  };
}
