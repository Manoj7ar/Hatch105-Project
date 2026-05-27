import { CRITERION_LABELS } from "./criteria";
import type { GateId } from "./gates";
import { formatGatesLine, GATE_LABELS } from "./trap-stories";
import type { CohortBenchmarks } from "./thesis-detail";
import {
  CRITERION_KEYS,
  type CriterionKey,
  type RankedThesis,
} from "./types";

export type WhyThisRank = {
  headline: string;
  lift: { key: CriterionKey; label: string; delta: number; reason: string };
  drag: { key: CriterionKey; label: string; delta: number; reason: string };
  gatesLine: string | null;
  rankContext: string | null;
};

export type SimilarThesis = {
  thesis: RankedThesis;
  distance: number;
  closestCriterion: string;
};

export type RankGateTension = {
  ref: string;
  title: string;
  level: "high" | "medium";
  gates: string[];
  fit: number;
  rank: number;
  summary: string;
};

function truncateReason(reason: string, max = 120): string {
  const first = reason.split(/[.!?]/)[0]?.trim() ?? reason;
  if (first.length <= max) return first;
  return `${first.slice(0, max - 1)}…`;
}

function roundDelta(n: number): number {
  return Math.round(n * 10) / 10;
}

export function getWhyThisRank(
  thesis: RankedThesis,
  benchmarks: CohortBenchmarks,
  ranked: RankedThesis[]
): WhyThisRank {
  let liftKey: CriterionKey = CRITERION_KEYS[0];
  let liftDelta = -Infinity;
  let dragKey: CriterionKey = CRITERION_KEYS[0];
  let dragDelta = Infinity;

  for (const key of CRITERION_KEYS) {
    const delta =
      thesis.criteria[key].score - benchmarks.criterionAverages[key];
    if (delta > liftDelta) {
      liftDelta = delta;
      liftKey = key;
    }
    if (delta < dragDelta) {
      dragDelta = delta;
      dragKey = key;
    }
  }

  if (liftDelta === -Infinity) liftDelta = 0;
  if (dragDelta === Infinity) dragDelta = 0;

  if (Math.abs(liftDelta) < 0.05 && Math.abs(dragDelta) < 0.05) {
    let lowestKey: CriterionKey = CRITERION_KEYS[0];
    let lowest = 5;
    for (const key of CRITERION_KEYS) {
      if (thesis.criteria[key].score < lowest) {
        lowest = thesis.criteria[key].score;
        lowestKey = key;
      }
    }
    dragKey = lowestKey;
    dragDelta = lowest - benchmarks.criterionAverages[lowestKey];
  }

  const lift = {
    key: liftKey,
    label: CRITERION_LABELS[liftKey],
    delta: roundDelta(liftDelta),
    reason: truncateReason(thesis.criteria[liftKey].reason),
  };

  const drag = {
    key: dragKey,
    label: CRITERION_LABELS[dragKey],
    delta: roundDelta(dragDelta),
    reason: thesis.trapNote
      ? truncateReason(thesis.trapNote, 160)
      : truncateReason(thesis.criteria[dragKey].reason),
  };

  const gatesLine =
    thesis.gatesTriggered.length > 0
      ? formatGatesLine(thesis.gatesTriggered)
      : null;

  const above = ranked.find((r) => r.rank === thesis.rank - 1);
  const below = ranked.find((r) => r.rank === thesis.rank + 1);
  let rankContext: string | null = null;
  if (above && below) {
    rankContext = `Fit ${thesis.fit} sits between ${above.ref} (${above.fit}) above and ${below.ref} (${below.fit}) below.`;
  } else if (above) {
    rankContext = `Below #${above.rank} ${above.title} (fit ${above.fit}) by ${roundDelta(above.fit - thesis.fit)}.`;
  } else if (below) {
    rankContext = `Top of list — ${roundDelta(thesis.fit - below.fit)} above ${below.ref} (${below.fit}).`;
  }

  const liftPart =
    lift.delta > 0
      ? `lifted by ${lift.label} (+${lift.delta} vs cohort)`
      : `near cohort on ${lift.label}`;
  const dragPart =
    gatesLine
      ? `tension from ${thesis.gatesTriggered.map((g) => GATE_LABELS[g as GateId] ?? g).join(", ")}`
      : drag.delta < 0
        ? `dragged by ${drag.label} (${drag.delta} vs cohort)`
        : `weakest on ${drag.label} (${thesis.criteria[dragKey].score}/5)`;

  const headline = `Rank #${thesis.rank} — ${liftPart}; ${dragPart}.`;

  return { headline, lift, drag, gatesLine, rankContext };
}

function criterionVector(thesis: RankedThesis): number[] {
  return CRITERION_KEYS.map((k) => thesis.criteria[k].score);
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

function closestCriterionLabel(a: RankedThesis, b: RankedThesis): string {
  let bestKey: CriterionKey = CRITERION_KEYS[0];
  let bestDiff = Infinity;
  for (const key of CRITERION_KEYS) {
    const diff = Math.abs(a.criteria[key].score - b.criteria[key].score);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestKey = key;
    }
  }
  return CRITERION_LABELS[bestKey];
}

export function getSimilarTheses(
  thesis: RankedThesis,
  ranked: RankedThesis[],
  limit = 3
): SimilarThesis[] {
  const vec = criterionVector(thesis);
  const candidates = ranked
    .filter((r) => r.ref !== thesis.ref)
    .map((r) => ({
      thesis: r,
      distance: euclideanDistance(vec, criterionVector(r)),
      closestCriterion: closestCriterionLabel(thesis, r),
    }))
    .sort((a, b) => a.distance - b.distance);

  return candidates.slice(0, limit);
}

export function getRankGateTension(thesis: RankedThesis): RankGateTension | null {
  if (thesis.gatesTriggered.length === 0) return null;
  if (thesis.fit < 4.0 && thesis.rank > 15) return null;

  const gates = [...thesis.gatesTriggered];
  const gateNames = gates
    .map((g) => GATE_LABELS[g as GateId] ?? g)
    .join(", ");

  const level: "high" | "medium" =
    thesis.fit >= 4.2 && thesis.rank <= 10 ? "high" : "medium";

  const summary =
    thesis.fit >= 4.0
      ? `High Hatch Fit (${thesis.fit}) at rank #${thesis.rank} despite hard gate(s): ${gateNames}. The headline score and gate caps tell different stories — read trap risk and capped criteria before treating rank as a green light.`
      : `Rank #${thesis.rank} with gate(s) ${gateNames} — fit ${thesis.fit} reflects caps applied after scoring.`;

  return {
    ref: thesis.ref,
    title: thesis.title,
    level,
    gates,
    fit: thesis.fit,
    rank: thesis.rank,
    summary,
  };
}

export function listCohortTensions(ranked: RankedThesis[]): RankGateTension[] {
  return ranked
    .map((t) => getRankGateTension(t))
    .filter((t): t is RankGateTension => t !== null)
    .sort((a, b) => b.fit - a.fit || a.rank - b.rank);
}

export function passesBuildSprintLens(thesis: RankedThesis): boolean {
  return (
    thesis.criteria.buildability.score >= 4 &&
    thesis.criteria.trapRisk.score >= 4
  );
}

export { groupTrapStories } from "./trap-stories";
export type { TrapStory, TrapStoryId } from "./trap-stories";
