import type { RankedThesis, Thesis, ThesisScore } from "./types";
import { TRAP_REFS } from "./criteria";

export function rankScores(
  scores: ThesisScore[],
  theses?: Thesis[]
): RankedThesis[] {
  const thesisMap = new Map(theses?.map((t) => [t.ref, t]));
  const sorted = [...scores].sort((a, b) => {
    if (b.fit !== a.fit) return b.fit - a.fit;
    return a.ref.localeCompare(b.ref);
  });

  return sorted.map((s, i) => ({
    ...s,
    rank: i + 1,
    thesis: thesisMap.get(s.ref),
  }));
}

export function placementSummary(
  ranked: RankedThesis[],
  newRefs: string[]
): { ref: string; rank: number; summary: string }[] {
  const byRef = new Map(ranked.map((r) => [r.ref, r]));
  return newRefs.map((ref) => {
    const item = byRef.get(ref);
    if (!item) return { ref, rank: -1, summary: "Not found in ranking." };
    const above = ranked.find((r) => r.rank === item.rank - 1);
    const below = ranked.find((r) => r.rank === item.rank + 1);
    const aboveStr = above ? `below ${above.ref} (${above.title})` : "at top";
    const belowStr = below ? `above ${below.ref} (${below.title})` : "at bottom";
    const topCriterion = Object.entries(item.criteria).sort(
      (a, b) => b[1].score - a[1].score
    )[0];
    return {
      ref,
      rank: item.rank,
      summary: `Entered at rank ${item.rank} (${aboveStr}, ${belowStr}) — strongest on ${topCriterion[0]} (${topCriterion[1].score}/5).`,
    };
  });
}

export function getTraps(ranked: RankedThesis[]): RankedThesis[] {
  return ranked.filter(
    (r) =>
      TRAP_REFS.has(r.ref) ||
      r.gatesTriggered.length > 0 ||
      r.fit < 3.2 ||
      r.criteria.trapRisk.score <= 2
  );
}
