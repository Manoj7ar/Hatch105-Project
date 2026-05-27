/** Condensed rubric for Groq prompts. Full detail: CRITERIA.md */
export const RUBRIC_SUMMARY = `
Hatch Fit Score — 3-person team, 10 weeks to revenue, Shopify/DTC. No invented € forecasts.

WEIGHTS (compute mentally; server applies exact weights):
- buildability 25% — v1 in 3d / 3w / 10w on thin Shopify surface (theme/checkout extension, webhooks, metafields)
- speedToRevenue 20% — self-serve App Store, paid in first billing cycle
- wedge 15% — one painful moment, one sentence
- distribution 15% — $50K–$2M DTC via App Store + light outbound
- trapRisk 10% (5 = SAFE for small team, 1 = swamp) — NOT "risky market"; means team-size trap
- expansion 15% — €10K → €1M without category pivot

SCORE ANCHORS (use these literally):
- buildability 5: theme/checkout extension or webhook-only v1 in days (OOS/404 block, cart upsell, SMS alert, review widget)
- buildability 2–1: generative 3D mesh, AR try-on, realtime voice/video on PDP, live-video host
- speedToRevenue 5: flat App Store $19–49/mo, obvious day-1 value, no enterprise sale
- wedge 5: "when X happens, we fix Y" in one line (WISMO, OOS notify, failed sub email)
- trapRisk 5: no incumbent price war, no science-project tech
- trapRisk 1–2: vs Yotpo/Gorgias/Klaviyo/Recharge on price alone; autonomous repricing; 3D research pipeline

HARD GATES (deterministic — if thesis text matches, you MUST score trapRisk ≤2 and buildability ≤2 when noted):
- G3D: generative 3D, 3D mesh, drape-capable garment, AR try-on → buildability ≤2, trapRisk ≤2, composite judgment "Trap or wrong team size"
- REALTIME_AI: Realtime API, live-video, voice clone, <300ms on PDP → buildability ≤2
- INCUMBENT_WAR: "vs Yotpo/Gorgias/Klaviyo/Recharge" WITH price moat → trapRisk ≤2 (mention in trapNote)
- AUTO_REPRICE: closed-loop repricing / Admin API price mutation → trapRisk ≤2
- POS_ENTERPRISE: Shopify POS overhaul, $10M+ only → distribution ≤3

Do NOT treat "Klaviyo-style" or "like Gorgias" as incumbent war unless thesis says vs/compete on price with them.

STRONG HATCH FIT pattern (typically fit ≥4.2): thin Shopify app, flat monthly, ship in <10 weeks, no 3D/realtime/autonomous pricing.

TRAP pattern (typically fit <2.8): looks huge but 3-person team cannot ship in 10 weeks.

Evidence tags: sourced | inferred | guess — from thesis text only.
`;

export const SCORING_CALIBRATION_EXAMPLES = `
CALIBRATION (match this judgment):
- Back-in-stock SMS via theme extension + webhook + Twilio, $24/mo App Store → buildability 5, speed 5, wedge 4–5, trapRisk 4–5, Strong Hatch fit.
- Native Liquid reviews vs Yotpo pricing → buildability 5, speed 5, wedge 5, trapRisk 2 (incumbent war), Viable not #1.
- Generative 3D linen mesh on every PDP → buildability 1–2, trapRisk 1–2, G3D gate, fit <2.8 Trap.
- Realtime founder voice on every PDP → buildability 1–2, REALTIME_AI, fit <2.8 Trap.
- Subscription failed-charge recovery emails, webhook + templates → buildability 4–5, speed 4–5, Strong/Viable.
`;
