import type { Thesis } from "../types";
import type { ResearchCitation } from "../types";
import { RUBRIC_SUMMARY } from "./rubric-summary";

export type ScorePromptExtras = {
  competitorBlock?: string;
  surfaceBlock?: string;
  researchSnippets?: { index: number; text: string }[];
  pass?: 1 | 2;
  pass1Json?: string;
};

export function buildScoreThesisPrompt(
  thesis: Thesis,
  extras: ScorePromptExtras = {},
  jsonFallback = false
): string {
  const jsonNote = jsonFallback
    ? "\nRespond with valid JSON matching the required schema."
    : "";

  const evidenceRule =
    "- Each criterion MUST include evidence: sourced | inferred | guess (from thesis/research only).";

  const blocks: string[] = [];
  if (extras.competitorBlock) blocks.push(extras.competitorBlock);
  if (extras.surfaceBlock) blocks.push(extras.surfaceBlock);
  if (extras.researchSnippets?.length) {
    blocks.push(
      "RESEARCH SNIPPETS (cite as [1], [2] in reasons when used):",
      ...extras.researchSnippets.map((s) => `[${s.index}] ${s.text}`)
    );
  }

  if (extras.pass === 1) {
    return `You score startup theses for Hatch (PASS 1 — scores only, no technicalSnapshot or v1Plan).

RUBRIC:
${RUBRIC_SUMMARY}

RULES:
- Score each criterion 1-5 with one sentence reason.
${evidenceRule}
- trapNote: empty string if none.
- verdict: short label aligned with composite judgment.${jsonNote}

${blocks.length ? blocks.join("\n\n") + "\n\n" : ""}THESIS:
ref: ${thesis.ref}
team: ${thesis.title}
one_liner: ${thesis.one_liner}
customer: ${thesis.example_customer}
wedge: ${thesis.wedge}`;
  }

  if (extras.pass === 2) {
    return `You complete PASS 2 for Hatch scoring: technicalSnapshot + v1Plan only.

PASS 1 SCORES:
${extras.pass1Json ?? ""}

RULES:
- technicalSnapshot: one paragraph on Shopify surface + integrations.
- v1Plan: concrete day 3, week 3, week 10 milestones.

${blocks.length ? blocks.join("\n\n") + "\n\n" : ""}THESIS:
ref: ${thesis.ref}
team: ${thesis.title}
wedge: ${thesis.wedge}`;
  }

  return `You score startup theses for Hatch: a 3-person team must stand up a Shopify/DTC product, reach revenue within 10 weeks, and grow toward €10K then €1M.

RUBRIC:
${RUBRIC_SUMMARY}

RULES:
- Score each criterion 1-5 with exactly one sentence reason citing TECHNICAL facts.
${evidenceRule}
- trapRisk: 5 = safe for small team, 1 = swamp.
- technicalSnapshot: one paragraph on Shopify surface + key integrations.
- v1Plan: concrete scope for day 3, week 3, week 10.
- trapNote: empty string if no trap.
- verdict: short label like "Strong Hatch fit".${jsonNote}

${blocks.length ? blocks.join("\n\n") + "\n\n" : ""}THESIS:
ref: ${thesis.ref}
team: ${thesis.title}
one_liner: ${thesis.one_liner}
customer: ${thesis.example_customer}
wedge: ${thesis.wedge}`;
}

export function citationsToSnippets(
  citations: ResearchCitation[]
): { index: number; text: string }[] {
  return citations.map((c) => ({
    index: c.index,
    text: `${c.title}: ${c.snippet.slice(0, 400)}`,
  }));
}
