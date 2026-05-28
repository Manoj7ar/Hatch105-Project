import type { Thesis, ThesisScore } from "./types";
import type { GateId } from "./gates";
import { matchCompetitorsInText } from "./competitors";

type ExpansionInput = Pick<
  ThesisScore,
  "criteria" | "gatesTriggered" | "surfaceFlags"
>;

export type ExpansionResult = {
  technicalSnapshot: string;
  v1Plan: { day3: string; week3: string; week10: string };
  trapNote?: string;
};

type SurfaceKind =
  | "theme_extension"
  | "checkout"
  | "functions"
  | "webhooks"
  | "admin_app"
  | "pos"
  | "headless"
  | "generic";

const TRAP_KEYWORDS =
  /\b(yotpo|gorgias|klaviyo|recharge|judge\.?me|skio|postscript|octane)\b/i;

function thesisBlob(thesis: Thesis): string {
  return `${thesis.title} ${thesis.one_liner} ${thesis.wedge} ${thesis.example_customer}`.toLowerCase();
}

function detectSurface(blob: string): SurfaceKind {
  if (/theme app extension|theme extension|app embed|liquid\/metafield/.test(blob))
    return "theme_extension";
  if (/checkout ui|checkout extension|checkout block/.test(blob)) return "checkout";
  if (/shopify functions|selling plan/.test(blob)) return "functions";
  if (/webhook|twilio|sms when/.test(blob)) return "webhooks";
  if (/shopify pos|\bpos\b/.test(blob)) return "pos";
  if (/hydrogen|headless/.test(blob)) return "headless";
  if (/admin api|sidebar|embedded app/.test(blob)) return "admin_app";
  return "generic";
}

function detectCustomerTier(blob: string): "smb" | "mid" | "enterprise" {
  if (/sub-\$1m|sub-\$500|\$50k|\$80k|\$100k|\$150k|dtc brands/.test(blob))
    return "smb";
  if (/\$10m|enterprise|10m\+|migrate/.test(blob)) return "enterprise";
  return "mid";
}

function surfaceLabel(kind: SurfaceKind): string {
  switch (kind) {
    case "theme_extension":
      return "Shopify Theme App Extension";
    case "checkout":
      return "Checkout UI extension";
    case "functions":
      return "Shopify Functions + Selling Plans";
    case "webhooks":
      return "Shopify webhooks + lightweight backend";
    case "admin_app":
      return "embedded Shopify admin app";
    case "pos":
      return "Shopify POS extension";
    case "headless":
      return "Hydrogen / headless storefront APIs";
    default:
      return "standard Shopify app (Admin + Storefront APIs)";
  }
}

function buildTechnicalSnapshot(
  thesis: Thesis,
  input: ExpansionInput,
  surface: SurfaceKind
): string {
  const blob = thesisBlob(thesis);
  const competitors = matchCompetitorsInText(blob);
  const surfaceName = surfaceLabel(surface);
  const apis: string[] = [];

  if (surface === "theme_extension" || surface === "generic") {
    apis.push("Theme App Extension API", "Storefront API");
  }
  if (surface === "checkout") apis.push("Checkout UI extensions", "Cart API");
  if (surface === "functions") apis.push("Shopify Functions", "Selling Plans API");
  if (surface === "webhooks") apis.push("webhooks", "Admin API");
  if (surface === "admin_app") apis.push("Admin API", "App Bridge");
  if (surface === "pos") apis.push("POS UI extensions");
  if (surface === "headless") apis.push("Storefront API", "Hydrogen");

  apis.push("Admin API", "Shopify Billing API");

  const buildScore = input.criteria.buildability.score;
  const backendNote =
    buildScore <= 2
      ? "Expect a heavier backend (ML pipeline, crawlers, or multi-tenant workers) beyond a thin extension."
      : buildScore <= 3
        ? "Backend stays modest: OAuth session storage, webhook handlers, and cached product reads."
        : "Minimal backend: extension-first logic with optional worker for async jobs.";

  const competitorNote =
    competitors.length > 0
      ? ` Competitive context: ${competitors.map((c) => c.citeAs).join(", ")}.`
      : "";

  const flagNote =
    input.surfaceFlags && input.surfaceFlags.length > 0
      ? ` Surface flags: ${input.surfaceFlags.map((f) => f.code).join(", ")}.`
      : "";

  const wedgeSnippet = thesis.wedge.trim().slice(0, 180);

  return (
    `${thesis.title} ships as a ${surfaceName} focused on: ${wedgeSnippet}. ` +
    `Core integrations: ${[...new Set(apis)].join(", ")}. ` +
    backendNote +
    competitorNote +
    flagNote
  ).trim();
}

function buildV1Plan(
  thesis: Thesis,
  input: ExpansionInput,
  surface: SurfaceKind
): ExpansionResult["v1Plan"] {
  const wedgeShort =
    thesis.wedge.length > 120 ? `${thesis.wedge.slice(0, 117)}…` : thesis.wedge;
  const customer = thesis.example_customer;

  const day3BySurface: Record<SurfaceKind, string> = {
    theme_extension: `Scaffold theme app extension + placeholder UI on the merchant's target template (${wedgeShort}).`,
    checkout: `Register checkout UI extension stub and render a static block on test checkout.`,
    functions: `Ship a Functions discount/selling-plan prototype with hard-coded rules for one SKU.`,
    webhooks: `Wire core webhooks (orders/products) to a dev store and log events for the wedge.`,
    admin_app: `Embedded admin app shell with OAuth and a single settings screen describing the wedge.`,
    pos: `POS tile stub that shows the value prop for ${customer}.`,
    headless: `Hydrogen/Storefront proof-of-concept page demonstrating the wedge on a dev storefront.`,
    generic: `OAuth install + admin settings page that captures merchant config for: ${wedgeShort}.`,
  };

  const week3ByBuild: Record<number, string> = {
    1: `Narrow scope to a demo-only path; document why full wedge (${wedgeShort}) needs a phase-2 architecture.`,
    2: `Integrate one external dependency and harden error handling for the primary merchant workflow.`,
    3: `Connect live Shopify data (inventory, orders, or catalog) and deliver the core wedge loop end-to-end.`,
    4: `Polish merchant-facing UX, add billing via Shopify Billing API, and ship App Store listing assets.`,
    5: `Full wedge live for pilot merchants (${customer}); measure day-1 activation metric.`,
  };

  const build = input.criteria.buildability.score;
  const week3 =
    week3ByBuild[build] ?? week3ByBuild[3];

  const expansionScore = input.criteria.expansion.score;
  const week10 =
    expansionScore >= 4
      ? `Add second module in the same workflow (analytics, upsell tier, or automation) without changing ICP.`
      : expansionScore <= 2
        ? `Validate retention on the single wedge; avoid platform sprawl until usage proves repeat value.`
        : `Expand to adjacent SKU/catalog surfaces and optional team seats while keeping the same install.`;

  return {
    day3: day3BySurface[surface],
    week3,
    week10,
  };
}

function buildTrapNote(
  thesis: Thesis,
  input: ExpansionInput
): string | undefined {
  const blob = thesisBlob(thesis);
  const trapScore = input.criteria.trapRisk.score;
  const gates = input.gatesTriggered as GateId[];

  if (gates.length === 0 && trapScore > 2 && !TRAP_KEYWORDS.test(blob)) {
    return undefined;
  }

  const parts: string[] = [];

  if (gates.includes("G3D")) {
    parts.push(
      "G3D: Generative/realtime 3D on PDP is research-grade — not a 10-week Shopify app for a 3-person team."
    );
  }
  if (gates.includes("REALTIME_AI")) {
    parts.push(
      "REALTIME_AI: Live multimodal or voice-clone surfaces add latency, cost, and liability beyond App Store norms."
    );
  }
  if (gates.includes("INCUMBENT_WAR")) {
    parts.push(
      "INCUMBENT_WAR: Pricing or positioning directly against a suite incumbent (Yotpo/Gorgias/Klaviyo) — expect slow wins."
    );
  }
  if (gates.includes("POS_ENTERPRISE")) {
    parts.push(
      "POS_ENTERPRISE: POS-heavy GTM stretches beyond self-serve App Store motion."
    );
  }
  if (gates.includes("AUTO_REPRICE")) {
    parts.push(
      "AUTO_REPRICE: Autonomous price mutations without human approval are a platform trust trap — narrow to recommendations."
    );
  }

  if (trapScore <= 2 && parts.length === 0) {
    parts.push(
      `Trap risk scored ${trapScore}/5: ${input.criteria.trapRisk.reason}`
    );
  }

  if (TRAP_KEYWORDS.test(blob) && !gates.includes("INCUMBENT_WAR")) {
    const competitors = matchCompetitorsInText(blob);
    if (competitors.length > 0) {
      parts.push(
        `Incumbent battlefield: ${competitors.map((c) => c.citeAs).join(", ")} — differentiate on wedge, not feature parity.`
      );
    }
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
}

/** Deterministic narrative fields for detail pages and chat context. */
export function generateExpansion(
  thesis: Thesis,
  input: ExpansionInput
): ExpansionResult {
  const blob = thesisBlob(thesis);
  const surface = detectSurface(blob);
  detectCustomerTier(blob); // reserved for future template variants

  return {
    technicalSnapshot: buildTechnicalSnapshot(thesis, input, surface),
    v1Plan: buildV1Plan(thesis, input, surface),
    trapNote: buildTrapNote(thesis, input),
  };
}
