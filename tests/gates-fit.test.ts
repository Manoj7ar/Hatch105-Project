import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { ThesisSchema } from "@/lib/types";
import { applyHardGates, applyGateFitCeiling } from "@/lib/gates";
import { scoreThesisHeuristic } from "@/lib/heuristic";
import { ThesisSchema } from "@/lib/types";
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

  it("caps fit below trap band when G3D fires", () => {
    expect(applyGateFitCeiling(4.5, ["G3D"])).toBeLessThanOrEqual(2.75);
  });
});

describe("heuristic calibration", () => {
  it("does not treat klaviyo-style as incumbent trap", () => {
    const t = ThesisSchema.parse({
      ref: "H-56",
      title: "BackInStock SMS",
      one_liner: "SMS when a watched variant is back in stock",
      example_customer: "US DTC, $80K–$2M",
      wedge:
        "Theme app extension + webhook; klaviyo-style flow not required. $24/mo App Store.",
    });
    const score = scoreThesisHeuristic(t);
    expect(score.criteria.trapRisk.score).toBeGreaterThanOrEqual(3);
    expect(score.fit).toBeGreaterThanOrEqual(3.8);
  });

  it("demotes generative 3D thesis below viable band", () => {
    const t = ThesisSchema.parse({
      ref: "H-57",
      title: "LinenRoom AR",
      one_liner: "Generative 3D linen drape preview on every PDP",
      example_customer: "home DTC, $200K–$4M",
      wedge:
        "Pipeline builds a drape-capable 3D garment mesh and AR try-on on PDP within 48 hours.",
    });
    const score = scoreThesisHeuristic(t);
    expect(score.gatesTriggered).toContain("G3D");
    expect(score.fit).toBeLessThan(2.9);
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
