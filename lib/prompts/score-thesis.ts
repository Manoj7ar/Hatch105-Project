import type { Thesis } from "../types";
import { RUBRIC_SUMMARY } from "./rubric-summary";

export function buildScoreThesisPrompt(thesis: Thesis, jsonFallback = false): string {
  const jsonNote = jsonFallback
    ? "\nRespond with valid JSON matching the required schema."
    : "";

  return `You score startup theses for Hatch: a 3-person team must stand up a Shopify/DTC product, reach revenue within 10 weeks, and grow toward €10K then €1M.

RUBRIC:
${RUBRIC_SUMMARY}

RULES:
- Score each criterion 1-5 with exactly one sentence reason citing TECHNICAL facts (Shopify APIs, app extensions, integrations, build surface, GTM). No invented TAM or € forecasts.
- trapRisk: 5 = safe for small team, 1 = swamp (incumbent war, science project, liability).
- technicalSnapshot: one paragraph on Shopify surface + key integrations required.
- v1Plan: concrete scope for day 3, week 3, week 10 (sellable milestones).
- trapNote: if a trap exists, one sentence why a 3-person team should avoid or narrow scope; else omit or empty string.
- Label guesses as "guess" when not inferable from the thesis text only.
- verdict: short label like "Strong Hatch fit" aligned with composite judgment.${jsonNote}

THESIS:
ref: ${thesis.ref}
team: ${thesis.title}
title: ${thesis.title}
one_liner: ${thesis.one_liner}
customer: ${thesis.example_customer}
wedge: ${thesis.wedge}`;
}
