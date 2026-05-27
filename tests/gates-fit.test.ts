import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { ThesisSchema } from "@/lib/types";
import { applyHardGates } from "@/lib/gates";
import { computeFit } from "@/lib/criteria";
import { scoreThesisHeuristic } from "@/lib/heuristic";

const golden = JSON.parse(
  readFileSync(join(__dirname, "fixtures/golden-theses.json"), "utf-8")
) as unknown[];

describe("hard gates", () => {
  it("triggers G3D for FittingRoom3D", () => {
    const t = ThesisSchema.parse(golden.find((g: { ref: string }) => g.ref === "H-03"));
    const { gatesTriggered } = applyHardGates(t);
    expect(gatesTriggered).toContain("G3D");
  });

  it("triggers AUTO_REPRICE for NightWatch", () => {
    const t = ThesisSchema.parse(golden.find((g: { ref: string }) => g.ref === "H-41"));
    const { gatesTriggered } = applyHardGates(t);
    expect(gatesTriggered).toContain("AUTO_REPRICE");
  });
});

describe("fit bands (heuristic)", () => {
  it("ZeroPage is strong fit band", () => {
    const t = ThesisSchema.parse(golden.find((g: { ref: string }) => g.ref === "H-08"));
    const score = scoreThesisHeuristic(t);
    expect(score.fit).toBeGreaterThanOrEqual(4.0);
  });

  it("FittingRoom3D is trap band", () => {
    const t = ThesisSchema.parse(golden.find((g: { ref: string }) => g.ref === "H-03"));
    const score = scoreThesisHeuristic(t);
    expect(score.fit).toBeLessThan(3.0);
  });

  it("fit is stable within tolerance on recompute", () => {
    const t = ThesisSchema.parse(golden.find((g: { ref: string }) => g.ref === "H-48"));
    const a = scoreThesisHeuristic(t);
    const b = scoreThesisHeuristic(t);
    expect(Math.abs(a.fit - b.fit)).toBeLessThanOrEqual(0.05);
    expect(computeFit(a.criteria)).toBeCloseTo(a.fit, 2);
  });
});
