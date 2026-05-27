import type { CriterionKey } from "./types";

export const CRITERION_WEIGHTS: Record<CriterionKey, number> = {
  buildability: 0.25,
  speedToRevenue: 0.2,
  wedge: 0.15,
  distribution: 0.15,
  trapRisk: 0.1,
  expansion: 0.15,
};

export const CRITERION_LABELS: Record<CriterionKey, string> = {
  buildability: "Buildability (10 weeks)",
  speedToRevenue: "Speed to revenue",
  wedge: "Wedge clarity",
  distribution: "Distribution to ICP",
  trapRisk: "Trap risk (safety)",
  expansion: "Expansion path",
};

export function computeFit(
  criteria: Record<CriterionKey, { score: number }>
): number {
  let total = 0;
  for (const key of Object.keys(CRITERION_WEIGHTS) as CriterionKey[]) {
    total += criteria[key].score * CRITERION_WEIGHTS[key];
  }
  return Math.round(total * 100) / 100;
}

export function verdictFromFit(fit: number): string {
  if (fit >= 4.2) return "Strong Hatch fit";
  if (fit >= 3.5) return "Viable with scope discipline";
  if (fit >= 2.8) return "Borderline — cut scope";
  return "Trap or wrong team size";
}

export const MVP_BY_REF: Record<string, string> = {
  "H-48":
    "Shopify app + email forwarding: auto-reply to WISMO with order status and tracking link. Charge $29/mo after 14-day trial; v1 in 3 days is OAuth + one carrier + template reply.",
  "H-08":
    "Theme app extension on OOS/404 only: top-3 similar products via text-embedding-3-small. $19/mo flat; ship installable demo in 3 days on one dev store.",
  "H-33":
    "Privy export wizard: pop-up HTML → theme extension + subscriber CSV → Shopify Email. One-time migration fee + $39/mo monitoring.",
  "H-47":
    "Sidebar helpdesk: order lookup + 20 canned replies, $19/mo unlimited tickets (fair use). No AI upsell — that's the wedge vs Gorgias.",
  "H-29":
    "Webhook listener for failed subscription charges + 3-step email/SMS sequence; $1 per recovered sub. v1: Recharge + Shopify native subs only.",
};

export const DEFAULT_MVP =
  "Shopify app with one visible merchant win in week 1: install → configure in <10 minutes → charge flat monthly on App Store. Expand only after 10 paying stores.";

export const TRAP_REFS = new Set([
  "H-03",
  "H-11",
  "H-20",
  "H-25",
  "H-32",
  "H-41",
]);
