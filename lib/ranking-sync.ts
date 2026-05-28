/** Client event: ranking dataset changed (live re-rank, clear extras, chat score handoff). */
export const RANKING_UPDATED_EVENT = "hatch105-ranking-updated";

export type RankingUpdatedDetail = {
  rankedRefs: string[];
};

export function notifyRankingUpdated(rankedRefs: string[]): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<RankingUpdatedDetail>(RANKING_UPDATED_EVENT, {
      detail: { rankedRefs },
    })
  );
}

export function rankedRefsFromState(
  ranked: { ref: string }[]
): string[] {
  return ranked.map((r) => r.ref);
}
