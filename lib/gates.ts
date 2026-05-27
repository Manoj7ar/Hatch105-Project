import type { Thesis, EvidenceTag } from "./types";
import type { CriterionKey } from "./types";

type CriterionInput = { score: number; reason: string; evidence?: EvidenceTag };

export type GateId = "G3D" | "REALTIME_AI" | "INCUMBENT_WAR" | "POS_ENTERPRISE" | "AUTO_REPRICE";

export type GateResult = {
  gatesTriggered: GateId[];
  caps: Partial<Record<CriterionKey, number>>;
};

const text = (t: Thesis) =>
  `${t.title} ${t.one_liner} ${t.wedge} ${t.example_customer}`.toLowerCase();

export function applyHardGates(thesis: Thesis): GateResult {
  const blob = text(thesis);
  const gatesTriggered: GateId[] = [];
  const caps: Partial<Record<CriterionKey, number>> = {};

  if (
    /generative 3d|3d mesh|drape-capable|ar try-on|wearable 3d/.test(blob)
  ) {
    gatesTriggered.push("G3D");
    caps.buildability = Math.min(caps.buildability ?? 5, 2);
  }

  if (
    /realtime api|real-time|live-video|voice clone|gpt-4o realtime|<300ms|live product stream/.test(
      blob
    )
  ) {
    gatesTriggered.push("REALTIME_AI");
    caps.buildability = Math.min(caps.buildability ?? 5, 2);
  }

  if (
    /vs yotpo|vs gorgias|vs klaviyo|1\/10th of yotpo|killing octane/.test(blob) &&
    /price|€|\/mo|\$/.test(blob)
  ) {
    gatesTriggered.push("INCUMBENT_WAR");
    caps.trapRisk = Math.min(caps.trapRisk ?? 5, 2);
  }

  if (/shopify pos|pos return/.test(blob)) {
    gatesTriggered.push("POS_ENTERPRISE");
    caps.distribution = Math.min(caps.distribution ?? 5, 3);
  }

  if (
    /closed-loop repricing|repricing agent|fires the shopify admin api price mutation/.test(
      blob
    )
  ) {
    gatesTriggered.push("AUTO_REPRICE");
    caps.trapRisk = Math.min(caps.trapRisk ?? 5, 2);
  }

  return { gatesTriggered, caps };
}

export function applyCapsToCriteria(
  criteria: Record<CriterionKey, CriterionInput>,
  caps: Partial<Record<CriterionKey, number>>,
  gatesTriggered: GateId[]
): Record<CriterionKey, CriterionInput & { evidence: EvidenceTag }> {
  const out = { ...criteria } as Record<CriterionKey, CriterionInput & { evidence: EvidenceTag }>;
  for (const key of Object.keys(out) as CriterionKey[]) {
    if (!out[key].evidence) out[key].evidence = "inferred";
  }
  for (const [key, cap] of Object.entries(caps) as [CriterionKey, number][]) {
    if (out[key].score > cap) {
      out[key] = {
        ...out[key],
        score: cap,
        reason: `${out[key].reason} [Gate ${gatesTriggered.join(",")} capped at ${cap}]`,
      };
    }
  }
  return out;
}

/** Cap composite Hatch Fit when hard gates imply trap / wrong team size. */
export function applyGateFitCeiling(
  fit: number,
  gatesTriggered: GateId[]
): number {
  if (gatesTriggered.some((g) => g === "G3D" || g === "REALTIME_AI")) {
    return Math.min(fit, 2.75);
  }
  if (gatesTriggered.includes("AUTO_REPRICE")) {
    return Math.min(fit, 3.15);
  }
  if (
    gatesTriggered.includes("POS_ENTERPRISE") &&
    gatesTriggered.length === 1
  ) {
    return Math.min(fit, 3.35);
  }
  return fit;
}
