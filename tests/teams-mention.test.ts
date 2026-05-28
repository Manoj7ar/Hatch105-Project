import { describe, expect, it } from "vitest";
import { findTeamsByPrefixFrom } from "@/lib/teams-mention";

const sampleTeams = [
  {
    ref: "H-99",
    title: "Acme Widgets",
    searchKey: "acme widgets h 99",
    rank: 12,
    fit: 3.8,
    verdict: "BUILD",
  },
];

describe("team mentions for extra companies", () => {
  it("finds teams by ref prefix", () => {
    const hits = findTeamsByPrefixFrom("h-9", sampleTeams, 8);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.ref).toBe("H-99");
  });
});
