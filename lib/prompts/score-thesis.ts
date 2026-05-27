import type { Thesis } from "../types";
import type { ResearchCitation } from "../types";
import { RUBRIC_SUMMARY, SCORING_CALIBRATION_EXAMPLES } from "./rubric-summary";
import { applyHardGates } from "../gates";
import { GATE_LABELS } from "../trap-stories";
import type { GateId } from "../gates";

export type ScorePromptExtras = {
  competitorBlock?: string;
  surfaceBlock?: string;
  researchSnippets?: { index: number; text: string }[];
  pass?: 1 | 2;
  pass1Json?: string;
};

function gateCheckBlock(thesis: Thesis): string {
  const { gatesTriggered } = applyHardGates(thesis);
  if (gatesTriggered.length === 0) {
    return "HARD GATE CHECK: none triggered from thesis text.";
  }
  const lines = gatesTriggered.map(
    (g) => `- ${g}: ${GATE_LABELS[g as GateId]} — apply caps from rubric before scoring.`
  );
  return `HARD GATE CHECK (mandatory — these fired on thesis text):\n${lines.join("\n")}`;
}

const RIGID_RULES = `
SCORING PROCEDURE (follow in order):
1. Read HARD GATE CHECK. If any gate fired, cap scores as rubric states (do not ignore).
2. Score each criterion 1–5 using anchors; one sentence reason with technical fact from thesis.
3. trapRisk = team-size safety (5=safe), NOT market size. Science-project tech → trapRisk 1–2.
4. If G3D or REALTIME_AI fired: verdict must be "Trap or wrong team size" or "Borderline — cut scope" and trapNote must name the gate.
5. Do not inflate scores because TAM sounds large. Reward thin Shopify surfaces and flat App Store pricing.
6. Each criterion MUST include evidence: sourced | inferred | guess.
7. verdict must align with your scores (Strong Hatch fit ≥4.2, Viable 3.5–4.19, Trap <2.8).
`;

export function buildScoreThesisPrompt(
  thesis: Thesis,
  extras: ScorePromptExtras = {},
  jsonFallback = false
): string {
  const jsonNote = jsonFallback
    ? "\nRespond with valid JSON matching the required schema."
    : "";

  const blocks: string[] = [gateCheckBlock(thesis)];
  if (extras.competitorBlock) blocks.push(extras.competitorBlock);
  if (extras.surfaceBlock) blocks.push(extras.surfaceBlock);
  if (extras.researchSnippets?.length) {
    blocks.push(
      "RESEARCH SNIPPETS (cite as [1], [2] in reasons when used):",
      ...extras.researchSnippets.map((s) => `[${s.index}] ${s.text}`)
    );
  }

  if (extras.pass === 1) {
    return `You are a strict Hatch105 ranking judge (PASS 1 — criterion scores only).

${RUBRIC_SUMMARY}
${SCORING_CALIBRATION_EXAMPLES}
${RIGID_RULES}
- trapNote: empty string if none; if gates fired, explain in trapNote.
- Do NOT output technicalSnapshot or v1Plan in pass 1.${jsonNote}

${blocks.join("\n\n")}

THESIS:
ref: ${thesis.ref}
team: ${thesis.title}
one_liner: ${thesis.one_liner}
customer: ${thesis.example_customer}
wedge: ${thesis.wedge}`;
  }

  if (extras.pass === 2) {
    return `Complete PASS 2: technicalSnapshot + v1Plan only (scores already fixed).

PASS 1 SCORES:
${extras.pass1Json ?? ""}

RULES:
- technicalSnapshot: one paragraph on Shopify surface + integrations.
- v1Plan: concrete day 3, week 3, week 10 milestones for a 3-person team.

${blocks.join("\n\n")}

THESIS:
ref: ${thesis.ref}
team: ${thesis.title}
wedge: ${thesis.wedge}`;
  }

  return `You are a strict Hatch105 ranking judge. Score for a 3-person team: stand up on Shopify, revenue within 10 weeks, path to €10K→€1M.

${RUBRIC_SUMMARY}
${SCORING_CALIBRATION_EXAMPLES}
${RIGID_RULES}
- technicalSnapshot: one paragraph on Shopify surface + key integrations.
- v1Plan: concrete day 3, week 3, week 10 scope.
- trapNote: empty string if none.${jsonNote}

${blocks.join("\n\n")}

THESIS:
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
