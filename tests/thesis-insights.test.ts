import { describe, it, expect } from "vitest";
import {
  getWhyThisRank,
  getSimilarTheses,
  getRankGateTension,
  listCohortTensions,
  passesBuildSprintLens,
  groupTrapStories,
} from "@/lib/thesis-insights";
import { getCohortBenchmarks } from "@/lib/thesis-detail";
import type { CriterionKey, RankedThesis } from "@/lib/types";
import { CRITERION_KEYS } from "@/lib/types";

function criterion(score: number, reason = "test") {
  return { score, reason, evidence: "inferred" as const };
}

function mockRanked(
  partial: Partial<RankedThesis> & Pick<RankedThesis, "ref" | "rank" | "fit">
): RankedThesis {
  const baseCriteria = Object.fromEntries(
    CRITERION_KEYS.map((k) => [k, criterion(3)])
  ) as RankedThesis["criteria"];

  const { criteria: criteriaPatch, ...rest } = partial;
  return {
    title: partial.ref,
    gatesTriggered: [],
    verdict: "Viable with scope discipline",
    scoredWith: "heuristic",
    scoredAt: "2026-01-01T00:00:00.000Z",
    criteriaVersion: "test",
    ...rest,
    criteria: { ...baseCriteria, ...criteriaPatch },
  };
}

describe("getRankGateTension", () => {
  it("detects high fit with INCUMBENT_WAR (H-14 style)", () => {
    const t = mockRanked({
      ref: "H-14",
      rank: 2,
      fit: 4.7,
      gatesTriggered: ["INCUMBENT_WAR"],
      criteria: {
        buildability: criterion(5),
        speedToRevenue: criterion(5),
        wedge: criterion(5),
        distribution: criterion(5),
        trapRisk: criterion(2),
        expansion: criterion(5),
      },
    });
    const tension = getRankGateTension(t);
    expect(tension).not.toBeNull();
    expect(tension?.level).toBe("high");
    expect(tension?.gates).toContain("INCUMBENT_WAR");
  });

  it("returns null when gates but low fit and low rank", () => {
    const t = mockRanked({
      ref: "H-99",
      rank: 40,
      fit: 2.5,
      gatesTriggered: ["G3D"],
    });
    expect(getRankGateTension(t)).toBeNull();
  });
});

describe("getSimilarTheses", () => {
  it("excludes self and returns up to 3 neighbors", () => {
    const ranked = [
      mockRanked({ ref: "H-01", rank: 1, fit: 4.5 }),
      mockRanked({ ref: "H-02", rank: 2, fit: 4.4 }),
      mockRanked({ ref: "H-03", rank: 3, fit: 4.3 }),
      mockRanked({ ref: "H-04", rank: 4, fit: 4.2 }),
    ];
    const similar = getSimilarTheses(ranked[0]!, ranked, 3);
    expect(similar).toHaveLength(3);
    expect(similar.every((s) => s.thesis.ref !== "H-01")).toBe(true);
    expect(similar[0]?.closestCriterion).toBeTruthy();
  });
});

describe("getWhyThisRank", () => {
  it("includes lift and headline with rank", () => {
    const ranked = [
      mockRanked({
        ref: "H-01",
        rank: 1,
        fit: 4.8,
        criteria: {
          buildability: criterion(5),
          speedToRevenue: criterion(5),
          wedge: criterion(4),
          distribution: criterion(4),
          trapRisk: criterion(5),
          expansion: criterion(4),
        },
      }),
      mockRanked({ ref: "H-02", rank: 2, fit: 4.0 }),
    ];
    const benchmarks = getCohortBenchmarks(ranked);
    const why = getWhyThisRank(ranked[0]!, benchmarks, ranked);
    expect(why.headline).toContain("Rank #1");
    expect(why.lift.delta).toBeGreaterThanOrEqual(0);
    expect(why.lift.label.length).toBeGreaterThan(0);
  });
});

describe("groupTrapStories", () => {
  it("assigns G3D thesis to paperTitan", () => {
    const ranked = [
      mockRanked({
        ref: "H-03",
        rank: 45,
        fit: 2.5,
        gatesTriggered: ["G3D"],
        criteria: {
          buildability: criterion(2),
          speedToRevenue: criterion(2),
          wedge: criterion(2),
          distribution: criterion(2),
          trapRisk: criterion(2),
          expansion: criterion(2),
        },
      }),
    ];
    const stories = groupTrapStories(ranked);
    const paper = stories.find((s) => s.id === "paperTitan");
    expect(paper?.theses.some((t) => t.ref === "H-03")).toBe(true);
  });
});

describe("passesBuildSprintLens", () => {
  it("passes when buildability and trap safety are strong", () => {
    const t = mockRanked({
      ref: "H-08",
      rank: 5,
      fit: 4.5,
      criteria: {
        buildability: criterion(5),
        speedToRevenue: criterion(4),
        wedge: criterion(4),
        distribution: criterion(4),
        trapRisk: criterion(5),
        expansion: criterion(4),
      },
    });
    expect(passesBuildSprintLens(t)).toBe(true);
  });
});

describe("listCohortTensions", () => {
  it("sorts tensions by fit descending", () => {
    const ranked = [
      mockRanked({ ref: "H-14", rank: 2, fit: 4.7, gatesTriggered: ["INCUMBENT_WAR"] }),
      mockRanked({ ref: "H-10", rank: 8, fit: 4.1, gatesTriggered: ["INCUMBENT_WAR"] }),
    ];
    const list = listCohortTensions(ranked);
    expect(list[0]!.fit).toBeGreaterThanOrEqual(list[1]!.fit);
  });
});
