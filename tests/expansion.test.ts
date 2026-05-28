import { describe, expect, it } from "vitest";
import { scoreThesisHeuristic } from "@/lib/heuristic";
import { generateExpansion } from "@/lib/expansion";
import golden from "./fixtures/golden-theses.json";
import type { Thesis } from "@/lib/types";

const theses = golden as Thesis[];

describe("generateExpansion", () => {
  it("fills technicalSnapshot and v1Plan for theme-extension wedge", () => {
    const t = theses.find((x) => x.ref === "H-08")!;
    const score = scoreThesisHeuristic(t);
    expect(score.technicalSnapshot).toBeTruthy();
    expect(score.technicalSnapshot!.toLowerCase()).toMatch(/theme/);
    expect(score.v1Plan?.day3).toBeTruthy();
    expect(score.v1Plan?.week3).toBeTruthy();
    expect(score.v1Plan?.week10).toBeTruthy();
  });

  it("emits trapNote for generative 3D (G3D gate)", () => {
    const t = theses.find((x) => x.ref === "H-03")!;
    const score = scoreThesisHeuristic(t);
    expect(score.trapNote).toBeTruthy();
    expect(score.trapNote).toMatch(/G3D|3D|research/i);
  });

  it("emits trapNote for autonomous repricing", () => {
    const t = theses.find((x) => x.ref === "H-41")!;
    const score = scoreThesisHeuristic(t);
    expect(score.trapNote).toBeTruthy();
    expect(score.trapNote!.toLowerCase()).toMatch(/repric|auto_reprice|trust/);
  });

  it("omits trapNote for strong App Store wedge when no gates", () => {
    const t = theses.find((x) => x.ref === "H-48")!;
    const partial = scoreThesisHeuristic(t);
    const expansion = generateExpansion(t, {
      criteria: partial.criteria,
      gatesTriggered: partial.gatesTriggered,
      surfaceFlags: partial.surfaceFlags,
    });
    expect(expansion.trapNote).toBeUndefined();
  });

  it("mentions checkout surface in snapshot when wedge cites checkout", () => {
    const t: Thesis = {
      ref: "H-99",
      title: "CheckoutLift",
      one_liner: "Recover abandoned carts on checkout.",
      example_customer: "Sub-$1M DTC",
      wedge: "Checkout UI extension block for post-purchase upsell",
    };
    const partial = scoreThesisHeuristic(t);
    const expansion = generateExpansion(t, {
      criteria: partial.criteria,
      gatesTriggered: partial.gatesTriggered,
      surfaceFlags: partial.surfaceFlags,
    });
    expect(expansion.technicalSnapshot.toLowerCase()).toMatch(/checkout/);
  });
});

describe("heuristic profile completeness", () => {
  it("new thesis scores include fields required by isThesisProfileComplete", () => {
    const t: Thesis = {
      ref: "H-51",
      title: "StockPing",
      one_liner: "SMS when a watched variant is back in stock.",
      example_customer: "Sub-$1M Shopify DTC",
      wedge: "Theme app extension + webhook to Twilio when variant restocks",
    };
    const score = scoreThesisHeuristic(t);
    expect(score.technicalSnapshot?.trim()).toBeTruthy();
    expect(score.v1Plan?.day3).toBeTruthy();
    expect(score.v1Plan?.week3).toBeTruthy();
    expect(score.v1Plan?.week10).toBeTruthy();
  });
});
