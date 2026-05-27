import type { Thesis } from "./types";
import type { CriterionKey } from "./types";

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
  criteria: Record<CriterionKey, { score: number; reason: string }>,
  caps: Partial<Record<CriterionKey, number>>,
  gatesTriggered: GateId[]
): Record<CriterionKey, { score: number; reason: string }> {
  const out = { ...criteria };
  for (const [key, cap] of Object.entries(caps) as [CriterionKey, number][]) {
    if (out[key].score > cap) {
      out[key] = {
        score: cap,
        reason: `${out[key].reason} [Gate ${gatesTriggered.join(",")} capped at ${cap}]`,
      };
    }
  }
  return out;
}
