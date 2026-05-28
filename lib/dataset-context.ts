import { getRankingState } from "./data";
import { CRITERION_LABELS } from "./criteria";
import type { CriterionKey, RankedThesis } from "./types";
import { RUBRIC_SUMMARY } from "./prompts/rubric-summary";

/** Groq on-demand TPM per request ≈ 8k tokens — keep dataset block ~5.5k tokens */
const MAX_CONTEXT_CHARS = 16_000;
const TOP_DETAIL_COUNT = 8;
const MAX_WEDGE_CHARS = 180;
const MAX_REASON_CHARS = 80;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

function scoreLine(row: RankedThesis): string {
  const parts: string[] = [];
  for (const key of Object.keys(CRITERION_LABELS) as CriterionKey[]) {
    const c = row.criteria[key];
    parts.push(`${key[0]}${c.score}`);
  }
  return parts.join(" ");
}

function formatThesisDetail(row: RankedThesis): string {
  const t = row.thesis;
  const lines: string[] = [
    `### ${row.title} (${row.ref}) | rank ${row.rank} | fit ${row.fit} | ${row.verdict}`,
    `scoredWith: ${row.scoredWith} | gates: ${row.gatesTriggered.join(" ") || "none"} | scores: ${scoreLine(row)}`,
  ];
  if (t) {
    lines.push(`one_liner: ${t.one_liner}`);
    lines.push(`customer: ${truncate(t.example_customer, 100)}`);
    lines.push(`wedge: ${truncate(t.wedge, MAX_WEDGE_CHARS)}`);
  }
  for (const key of Object.keys(CRITERION_LABELS) as CriterionKey[]) {
    const c = row.criteria[key];
    lines.push(`${key}: ${c.score}/5 — ${truncate(c.reason, MAX_REASON_CHARS)}`);
  }
  if (row.technicalSnapshot) {
    lines.push(`technicalSnapshot: ${truncate(row.technicalSnapshot, 120)}`);
  }
  if (row.v1Plan) {
    lines.push(
      `v1: d3=${truncate(row.v1Plan.day3, 70)} | w3=${truncate(row.v1Plan.week3, 70)} | w10=${truncate(row.v1Plan.week10, 70)}`
    );
  }
  if (row.trapNote) lines.push(`trapNote: ${truncate(row.trapNote, 100)}`);
  return lines.join("\n");
}

function formatThesisSlim(row: RankedThesis): string {
  const t = row.thesis;
  const reasons = (Object.keys(CRITERION_LABELS) as CriterionKey[])
    .map((k) => `${k[0]}:${truncate(row.criteria[k].reason, 50)}`)
    .join(" | ");
  return [
    `${row.title} (${row.ref}) | #${row.rank} | fit ${row.fit} | ${row.verdict}`,
    `scores ${scoreLine(row)} | gates ${row.gatesTriggered.join(" ") || "none"}`,
    t ? `${t.one_liner} | wedge: ${truncate(t.wedge, 100)}` : "",
    `reasons: ${reasons}`,
    row.trapNote ? `trap: ${truncate(row.trapNote, 70)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildDatasetContext(): string {
  const { ranked } = getRankingState();
  const generatedAt = new Date().toISOString();

  const parts: string[] = [
    `generatedAt: ${generatedAt}`,
    `Snapshot: ${ranked.length} teams. Top ${TOP_DETAIL_COUNT} include full criterion notes; others are compact.`,
    "Team name = title field; ref = H-XX. Users may @-mention by name or ref.",
    "",
    "## Ranking table (best first)",
    "| rank | Team | ref | fit | verdict | gates |",
    "|------|------|-----|-----|---------|-------|",
  ];

  for (const row of ranked) {
    const gates = row.gatesTriggered.join(" ") || "—";
    parts.push(
      `| ${row.rank} | ${row.title} | ${row.ref} | ${row.fit} | ${row.verdict} | ${gates} |`
    );
  }

  parts.push("", "## Team index", "| Team | ref | rank | fit |", "|------|-----|------|-----|");
  for (const row of ranked) {
    parts.push(`| ${row.title} | ${row.ref} | ${row.rank} | ${row.fit} |`);
  }

  const top = ranked[0];
  if (top) {
    parts.push("", "## Executive pick", `#1: ${top.title} (${top.ref}, fit ${top.fit})`);
  }

  parts.push("", "## Rubric", RUBRIC_SUMMARY.trim(), "", "## Thesis details", "");

  ranked.forEach((row, i) => {
    parts.push(i < TOP_DETAIL_COUNT ? formatThesisDetail(row) : formatThesisSlim(row));
    parts.push("");
  });

  let text = parts.join("\n");

  if (text.length > MAX_CONTEXT_CHARS) {
    const tableEnd = text.indexOf("## Thesis details");
    const header = text.slice(0, tableEnd);
    const slim: string[] = [header, ""];
    for (const row of ranked) {
      slim.push(formatThesisSlim(row));
      slim.push("");
    }
    text = slim.join("\n");
  }

  if (text.length > MAX_CONTEXT_CHARS) {
    text = truncate(text, MAX_CONTEXT_CHARS);
  }

  return text;
}
