import type { RankedThesis, RankingState } from "./types";
import { CRITERION_LABELS, MVP_BY_REF, DEFAULT_MVP } from "./criteria";
import type { CriterionKey } from "./types";

export function generateRankingMarkdown(state: RankingState): string {
  const lines: string[] = [
    "# Hatch105 — Ranked Theses",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Executive pick",
    "",
    `**#1 — ${state.executivePick.title} (${state.executivePick.ref})** — Hatch Fit ${state.executivePick.fit}`,
    "",
    state.executivePick.mvp,
    "",
    `**Trap we demoted:** ${state.executivePick.trapDemoted.title} (${state.executivePick.trapDemoted.ref}) — ${state.executivePick.trapDemoted.reason}`,
    "",
    "## Top 3 rationale",
    "",
  ];

  state.top3.forEach((t, i) => {
    lines.push(`### ${i + 1}. ${t.title} (${t.ref}) — ${t.fit} — ${t.verdict}`);
    lines.push("");
    for (const key of Object.keys(CRITERION_LABELS) as CriterionKey[]) {
      const c = t.criteria[key];
      lines.push(
        `- **${CRITERION_LABELS[key]}:** ${c.score}/5 — ${c.reason}`
      );
    }
    if (t.gatesTriggered.length) {
      lines.push(`- **Gates:** ${t.gatesTriggered.join(", ")}`);
    }
    lines.push("");
  });

  lines.push("## Top 10", "", "| Rank | Ref | Title | Fit | Verdict |", "|------|-----|-------|-----|---------|");
  state.ranked.slice(0, 10).forEach((t) => {
    lines.push(
      `| ${t.rank} | ${t.ref} | ${t.title} | ${t.fit} | ${t.verdict} |`
    );
  });

  lines.push("", "## Traps we demoted", "");
  state.traps.slice(0, 8).forEach((t) => {
    lines.push(
      `- **${t.ref} ${t.title}** (rank ${t.rank}, fit ${t.fit})${t.gatesTriggered.length ? ` — gates: ${t.gatesTriggered.join(", ")}` : ""}`
    );
  });

  lines.push("", "## Full ranking", "", "| Rank | Ref | Title | Fit | Gates |", "|------|-----|-------|-----|-------|");
  state.ranked.forEach((t) => {
    lines.push(
      `| ${t.rank} | ${t.ref} | ${t.title} | ${t.fit} | ${t.gatesTriggered.join(" ") || "—"} |`
    );
  });

  lines.push(
    "",
    "## Open questions",
    "",
    "1. H-10 QuizCart — checkout extension policy vs Octane.",
    "2. H-29 DunningDesk — webhook coverage across subscription apps.",
    "3. H-41 NightWatch — autonomous repricing liability UX.",
    ""
  );

  return lines.join("\n");
}

export function buildRankingState(
  ranked: RankedThesis[],
  trapDemoted?: { ref: string; title: string; reason: string }
): RankingState {
  const top = ranked[0];
  const trap =
    trapDemoted ??
    (() => {
      const t =
        ranked.find((r) => r.ref === "H-03") ??
        ranked.find((r) => r.gatesTriggered.includes("G3D"));
      return {
        ref: t?.ref ?? "H-03",
        title: t?.title ?? "FittingRoom3D",
        reason:
          "Real market, but generative 3D mesh is a research problem — wrong for a 3-person 10-week sprint.",
      };
    })();

  return {
    ranked,
    executivePick: {
      ref: top.ref,
      title: top.title,
      fit: top.fit,
      mvp: MVP_BY_REF[top.ref] ?? DEFAULT_MVP,
      trapDemoted: trap,
    },
    top3: ranked.slice(0, 3),
    traps: ranked.filter(
      (r) =>
        r.gatesTriggered.length > 0 ||
        r.fit < 3.3 ||
        r.criteria.trapRisk.score <= 2
    ),
  };
}
