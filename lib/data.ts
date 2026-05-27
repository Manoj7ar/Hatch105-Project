import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import {
  ThesisSchema,
  normalizeThesisScore,
  type Thesis,
  type ThesisScore,
} from "./types";
import { rankScores } from "./rank";
import { buildRankingState } from "./markdown";
import type { RankingState } from "./types";

const SCORES_DIR = join(process.cwd(), "scores");

export function loadCandidateTheses(): Thesis[] {
  const path = join(process.cwd(), "candidate_theses.json");
  const raw = readFileSync(path, "utf-8");
  const data = JSON.parse(raw);
  return data.map((t: unknown) => ThesisSchema.parse(t));
}

export function ensureScoresDir() {
  if (!existsSync(SCORES_DIR)) mkdirSync(SCORES_DIR, { recursive: true });
}

export function scorePath(ref: string) {
  return join(SCORES_DIR, `${ref}.json`);
}

export function saveScore(score: ThesisScore) {
  ensureScoresDir();
  writeFileSync(scorePath(score.ref), JSON.stringify(score, null, 2));
}

export function loadScore(ref: string): ThesisScore | null {
  const p = scorePath(ref);
  if (!existsSync(p)) return null;
  return normalizeThesisScore(JSON.parse(readFileSync(p, "utf-8")));
}

export function loadAllScores(): ThesisScore[] {
  ensureScoresDir();
  const files = readdirSync(SCORES_DIR).filter((f) => f.endsWith(".json"));
  return files
    .map((f) =>
      normalizeThesisScore(
        JSON.parse(readFileSync(join(SCORES_DIR, f), "utf-8"))
      )
    )
    .sort((a, b) => a.ref.localeCompare(b.ref));
}

export function getRankingState(extraTheses?: Thesis[]): RankingState {
  const base = loadCandidateTheses();
  const allTheses = extraTheses
    ? [...base, ...extraTheses.filter((t) => !base.some((b) => b.ref === t.ref))]
    : base;

  const scores: ThesisScore[] = [];
  for (const t of allTheses) {
    const s = loadScore(t.ref);
    if (s) scores.push(s);
  }

  if (scores.length === 0) {
    throw new Error(
      "No scores found. Run npm run seed to generate scores/*.json"
    );
  }

  const ranked = rankScores(scores, allTheses);
  return buildRankingState(ranked);
}

export function writeRankingMarkdown(state: RankingState) {
  const { generateRankingMarkdown } = require("./markdown") as typeof import("./markdown");
  writeFileSync(
    join(process.cwd(), "RANKING.md"),
    generateRankingMarkdown(state)
  );
}
