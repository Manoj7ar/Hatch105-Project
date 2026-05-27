import type { Thesis, EvidenceTag } from "./types";
import type { CriterionKey } from "./types";
import { applyHardGates, applyCapsToCriteria } from "./gates";
import { computeFit, verdictFromFit } from "./criteria";
import { CRITERIA_VERSION } from "./criteria-version";
import { checkShopifySurfaces } from "./shopify-surfaces";

type CriterionResult = { score: number; reason: string; evidence: EvidenceTag };

function scoreBuildability(blob: string, ref: string): CriterionResult {
  const traps = ["generative 3d", "3d mesh", "realtime api", "live-video", "voice clone"];
  if (traps.some((t) => blob.includes(t)))
    return { score: 1, reason: "Research-grade or realtime multimodal — not a 10-week v1.", evidence: "inferred" };

  if (/theme app extension|checkout extension|checkout block|liquid\/metafield|zero external javascript/.test(blob))
    return { score: 5, reason: "Thin Shopify surface (extension/block); v1 in days.", evidence: "sourced" };

  if (/shopify functions|selling plan|webhook|one-click|sidebar/.test(blob))
    return { score: 4, reason: "Standard Shopify app + one integration; ~3 week v1.", evidence: "inferred" };

  if (/pos |b2b portal|faire|nightly crawl|competitor|repricing agent/.test(blob))
    return { score: 2, reason: "Heavy integration or operational risk for small team.", evidence: "inferred" };

  if (/embedding|co-purchase|ml |predicted moment|account updater/.test(blob))
    return { score: 3, reason: "Non-trivial data/ML pipeline.", evidence: "inferred" };

  if (ref === "H-50")
    return { score: 4, reason: "Wizard + SKU rules — niche but buildable Shopify app.", evidence: "inferred" };

  return { score: 3, reason: "Typical Shopify app scope.", evidence: "guess" };
}

function scoreSpeed(blob: string): CriterionResult {
  if (/per-save|success fee|\$1 per|flat €|flat monthly|\$19\/mo|\$29\/mo/.test(blob))
    return { score: 5, reason: "Clear monetization; self-serve; immediate ROI story.", evidence: "sourced" };
  if (/app store|install in one click|day-1|wismo|oos|404/.test(blob))
    return { score: 4, reason: "App Store subscription; value visible in first cycle.", evidence: "inferred" };
  if (/migrate|stockist|enterprise|10m\+/.test(blob))
    return { score: 2, reason: "Long setup or relationship-driven sale.", evidence: "inferred" };
  if (/habit|blind flash|network/.test(blob))
    return { score: 2, reason: "Revenue depends on behaviour change.", evidence: "guess" };
  return { score: 3, reason: "Needs onboarding or data before full value.", evidence: "guess" };
}

function scoreWedge(blob: string, t: Thesis): CriterionResult {
  const combined = `${t.one_liner} ${t.wedge}`;
  if (combined.length < 120 && /recover|auto-|without human|€0|escape|wismo/.test(blob))
    return { score: 5, reason: "One painful moment, one fix — merchant gets it instantly.", evidence: "sourced" };
  if (/vs |replace|kill|trap|not just/.test(blob))
    return { score: 4, reason: "Clear job-to-be-done vs incumbent or status quo.", evidence: "sourced" };
  if (/dashboard|platform|three apps|loyalty × referral/.test(blob))
    return { score: 2, reason: "Bundle/platform — harder to explain in 10 seconds.", evidence: "inferred" };
  if (/persona engine|scorecard|health/.test(blob))
    return { score: 2, reason: "Vague outcome or broad analytics play.", evidence: "guess" };
  return { score: 3, reason: "Understandable wedge with some scope breadth.", evidence: "inferred" };
}

function scoreDistribution(blob: string, customer: string): CriterionResult {
  if (/sub-\$500|sub-\$1m|\$50k–|\$50k-/.test(customer + blob))
    return { score: 5, reason: "Shopify App Store + tight DTC ICP.", evidence: "sourced" };
  if (/shopify app|dtc brands/.test(blob))
    return { score: 4, reason: "App Store + content motion.", evidence: "inferred" };
  if (/pos |\$10m|recharge|klaviyo|10m\+/.test(blob + customer))
    return { score: 2, reason: "Larger merchants or non-App-Store motion.", evidence: "inferred" };
  if (/reptile|eu apparel/.test(blob))
    return { score: 2, reason: "Niche vertical or regional GTM.", evidence: "guess" };
  return { score: 3, reason: "Reachable but needs outbound or education.", evidence: "guess" };
}

function scoreTrap(blob: string, ref: string): CriterionResult {
  if (["H-03", "H-11", "H-20", "H-32", "H-41"].includes(ref))
    return { score: 1, reason: "Known trap: science project or liability-heavy automation.", evidence: "sourced" };
  if (/yotpo|gorgias|klaviyo|recharge|octane|loop advanced/.test(blob))
    return { score: 2, reason: "Incumbent or suite-player battlefield.", evidence: "inferred" };
  if (/closed-loop repricing|autonomous|realtime/.test(blob))
    return { score: 2, reason: "Platform or trust risk.", evidence: "inferred" };
  if (/competitor exists but|checkout extension/.test(blob))
    return { score: 4, reason: "Competitors exist; differentiated placement/mechanic.", evidence: "inferred" };
  return { score: 4, reason: "No dominant incumbent on exact wedge.", evidence: "guess" };
}

function scoreExpansion(blob: string): CriterionResult {
  if (/agent|wismo|audit|catalog health|dunning|recovery/.test(blob))
    return { score: 5, reason: "Wedge expands in same merchant workflow.", evidence: "inferred" };
  if (/per-save|tier|upsell|platform/.test(blob))
    return { score: 4, reason: "Clear upsell or module expansion.", evidence: "inferred" };
  if (/gamif|flash|gift-wrap template/.test(blob))
    return { score: 2, reason: "Single-feature or seasonal ceiling.", evidence: "guess" };
  if (/reptile|habitat/.test(blob))
    return { score: 1, reason: "Vertical lock-in.", evidence: "inferred" };
  return { score: 3, reason: "Bolt-on expansion possible.", evidence: "guess" };
}

/** Manual boosts/demotes from criteria doc sanity pass */
const REF_ADJUSTMENTS: Record<string, Partial<Record<CriterionKey, number>>> = {
  "H-08": { buildability: 5, speedToRevenue: 4, wedge: 5, trapRisk: 5 },
  "H-48": { buildability: 4, speedToRevenue: 5, wedge: 5, expansion: 5 },
  "H-47": { buildability: 4, speedToRevenue: 5, distribution: 5 },
  "H-33": { buildability: 4, wedge: 5, speedToRevenue: 4 },
  "H-29": { speedToRevenue: 5, expansion: 4 },
  "H-03": { buildability: 1, trapRisk: 1 },
  "H-32": { buildability: 1, trapRisk: 1 },
  "H-20": { buildability: 1, trapRisk: 1 },
  "H-11": { buildability: 1, wedge: 2 },
  "H-41": { trapRisk: 1, buildability: 2 },
  "H-25": { buildability: 2, wedge: 2 },
};

export function scoreThesisHeuristic(thesis: Thesis) {
  const blob = `${thesis.title} ${thesis.one_liner} ${thesis.wedge}`.toLowerCase();
  const customer = thesis.example_customer.toLowerCase();

  let criteria = {
    buildability: scoreBuildability(blob, thesis.ref),
    speedToRevenue: scoreSpeed(blob),
    wedge: scoreWedge(blob, thesis),
    distribution: scoreDistribution(blob, customer),
    trapRisk: scoreTrap(blob, thesis.ref),
    expansion: scoreExpansion(blob),
  } as Record<CriterionKey, CriterionResult>;

  const adj = REF_ADJUSTMENTS[thesis.ref];
  if (adj) {
    for (const [k, v] of Object.entries(adj) as [CriterionKey, number][]) {
      criteria[k] = {
        score: v,
        reason: `${criteria[k].reason} [Calibrated for Hatch dataset.]`,
        evidence: criteria[k].evidence,
      };
    }
  }

  const surfaceFlags = checkShopifySurfaces(thesis);

  const { gatesTriggered, caps } = applyHardGates(thesis);
  criteria = applyCapsToCriteria(criteria, caps, gatesTriggered);

  const fit = computeFit(criteria);
  const verdict = verdictFromFit(fit);

  return {
    ref: thesis.ref,
    title: thesis.title,
    criteria,
    gatesTriggered,
    fit,
    verdict,
    scoredWith: "heuristic" as const,
    scoredAt: new Date().toISOString(),
    criteriaVersion: CRITERIA_VERSION,
    surfaceFlags: surfaceFlags.length ? surfaceFlags : undefined,
  };
}
