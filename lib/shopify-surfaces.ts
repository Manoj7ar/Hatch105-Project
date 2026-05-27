import type { Thesis } from "./types";
import type { z } from "zod";
import { SurfaceFlagSchema } from "./types";

export type SurfaceFlag = z.infer<typeof SurfaceFlagSchema>;

const KNOWN_SURFACES = [
  "checkout ui extension",
  "checkout extension",
  "checkout block",
  "shopify functions",
  "theme app extension",
  "admin api",
  "storefront api",
  "hydrogen",
  "pos",
  "selling plan",
  "webhook",
  "metafield",
  "liquid",
  "app embed",
  "customer account extension",
];

type Rule = {
  code: string;
  test: (blob: string, thesis: Thesis) => boolean;
  message: string;
  severity: SurfaceFlag["severity"];
};

const RULES: Rule[] = [
  {
    code: "CHECKOUT_WITHOUT_PLUS",
    test: (b) =>
      /checkout (mutation|customization|extension)/.test(b) &&
      !/plus|checkout ui extension|checkout extension/.test(b),
    message:
      "Deep checkout changes usually require Shopify Plus and Checkout UI extensions — verify merchant tier.",
    severity: "warning",
  },
  {
    code: "REALTIME_3D_PDP",
    test: (b) =>
      /generative 3d|3d mesh|realtime.*pdp|every product page.*3d/.test(b),
    message:
      "Realtime generative 3D on every PDP is not a standard Shopify app surface — research-grade scope.",
    severity: "error",
  },
  {
    code: "VOICE_CLONE_REALTIME",
    test: (b) => /voice clone|realtime api.*voice|founder voice/.test(b),
    message:
      "Realtime voice clone on storefront is high liability and non-standard Shopify surface.",
    severity: "error",
  },
  {
    code: "AUTONOMOUS_REPRICING",
    test: (b) => /autonomous repric|closed-loop repric|without human approval/.test(b),
    message:
      "Autonomous repricing agents raise platform trust and liability flags — narrow human-in-loop scope.",
    severity: "warning",
  },
  {
    code: "UNKNOWN_SURFACE",
    test: (b, t) => {
      const blob = `${b} ${t.wedge}`;
      const mentionsShopify = /shopify|app store|extension|checkout|theme/.test(blob);
      const citesKnown = KNOWN_SURFACES.some((s) => blob.includes(s));
      return mentionsShopify && !citesKnown && /native|deep integration|platform-wide/.test(blob);
    },
    message:
      "Claims a native Shopify integration but does not name a known surface (extensions, Functions, APIs).",
    severity: "info",
  },
  {
    code: "HYDROGEN_HEADLESS",
    test: (b) => /hydrogen|headless storefront/.test(b),
    message:
      "Hydrogen/headless is a valid surface but slower GTM than App Store theme extensions.",
    severity: "info",
  },
];

export function checkShopifySurfaces(thesis: Thesis): SurfaceFlag[] {
  const blob = `${thesis.title} ${thesis.one_liner} ${thesis.wedge}`.toLowerCase();
  const flags: SurfaceFlag[] = [];
  for (const rule of RULES) {
    if (rule.test(blob, thesis)) {
      flags.push({
        code: rule.code,
        message: rule.message,
        severity: rule.severity,
      });
    }
  }
  return flags;
}

export function formatSurfaceFlagsBlock(flags: SurfaceFlag[]): string {
  if (flags.length === 0) return "";
  const lines = flags.map(
    (f) => `[${f.severity.toUpperCase()} ${f.code}] ${f.message}`
  );
  return `SHOPIFY SURFACE CHECK:\n${lines.join("\n")}`;
}
