#!/usr/bin/env npx tsx
import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { readFileSync } from "fs";
import { parseThesesInput } from "../lib/parse";
import { scoreThesisForRanking } from "../lib/score-pipeline";
import {
  saveScore,
  loadAllScores,
  loadCandidateTheses,
  mergeExtraTheses,
} from "../lib/data";
import { rankScores, placementSummary } from "../lib/rank";
import { generateRankingMarkdown, buildRankingState } from "../lib/markdown";
import { writeFileSync } from "fs";
import { join } from "path";

function parseArgs() {
  const args = process.argv.slice(2);
  let input: string | null = null;
  let merge = false;
  let format: "json" | "csv" | "auto" = "auto";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) input = args[++i];
    else if (args[i] === "--merge") merge = true;
    else if (args[i] === "--format" && args[i + 1])
      format = args[++i] as "json" | "csv" | "auto";
  }
  return { input, merge, format };
}

async function main() {
  const { input, merge, format } = parseArgs();

  if (!input) {
    console.error("Usage: npx tsx scripts/rank.ts --input new_theses.json [--merge]");
    process.exit(1);
  }

  const raw = readFileSync(input, "utf-8");
  const newTheses = parseThesesInput(raw, format);
  console.log(`Scoring ${newTheses.length} new thesis(es)...`);

  for (const t of newTheses) {
    const score = await scoreThesisForRanking(t);
    saveScore(score);
    console.log(`  ${t.ref} → fit ${score.fit}`);
  }

  const base = loadCandidateTheses();
  const added = newTheses.filter((n) => !base.some((b) => b.ref === n.ref));
  if (merge && added.length > 0) mergeExtraTheses(added);

  const allTheses = merge ? [...base, ...added] : [...base, ...newTheses];

  const scores = loadAllScores().filter((s) =>
    allTheses.some((t) => t.ref === s.ref)
  );
  const ranked = rankScores(scores, allTheses);
  const placements = placementSummary(
    ranked,
    newTheses.map((t) => t.ref)
  );

  console.log("\n--- Live re-rank placements ---");
  placements.forEach((p) => console.log(`${p.ref}: ${p.summary}`));

  const state = buildRankingState(ranked);
  const md = generateRankingMarkdown(state);
  writeFileSync(join(process.cwd(), "RANKING.md"), md);
  console.log("\nUpdated RANKING.md");
  console.log(`Top 3: ${state.top3.map((t) => t.ref).join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
