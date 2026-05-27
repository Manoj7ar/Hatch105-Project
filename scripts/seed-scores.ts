#!/usr/bin/env npx tsx
import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { loadCandidateTheses, saveScore, loadAllScores } from "../lib/data";
import { scoreThesis, scoringModeLabel } from "../lib/scorer";
import { rankScores } from "../lib/rank";
import { buildRankingState, generateRankingMarkdown } from "../lib/markdown";
import { writeFileSync } from "fs";
import { join } from "path";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const theses = loadCandidateTheses();
  const mode = scoringModeLabel();
  const delay = Number(process.env.GROQ_SEED_DELAY_MS ?? 200);

  console.log(`Scoring ${theses.length} theses (mode: ${mode})...`);
  if (mode === "groq") {
    console.log(`Delay between calls: ${delay}ms`);
  }

  for (const t of theses) {
    const score = await scoreThesis(t);
    saveScore(score);
    console.log(
      `  ${t.ref} ${t.title} → ${score.fit} (${score.verdict}) [${score.scoredWith}]`
    );
    if (mode === "groq" && delay > 0) {
      await sleep(delay);
    }
  }

  const scores = loadAllScores();
  const ranked = rankScores(scores, theses);
  const state = buildRankingState(ranked);
  const md = generateRankingMarkdown(state);
  writeFileSync(join(process.cwd(), "RANKING.md"), md);
  console.log("\nWrote RANKING.md and scores/*.json");
  console.log(
    `\n#1: ${state.executivePick.ref} ${state.executivePick.title} (${state.executivePick.fit})`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
