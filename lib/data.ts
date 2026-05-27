import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
} from "fs";
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
import { CRITERIA_VERSION } from "./criteria-version";
import { applyOverrideToScore, loadOverride } from "./override";

const SCORES_DIR = join(process.cwd(), "scores");
const ARCHIVE_DIR = join(SCORES_DIR, "archive");
export const INITIAL_DATASET_DIR = join(process.cwd(), "Initial-dataset");
const RESEARCH_DIR = join(process.cwd(), "research");

export function loadCandidateTheses(): Thesis[] {
  const path = join(INITIAL_DATASET_DIR, "candidate_theses.json");
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

function archiveScoreIfChanged(ref: string, incoming: ThesisScore) {
  const p = scorePath(ref);
  if (!existsSync(p)) return;
  const prev = normalizeThesisScore(JSON.parse(readFileSync(p, "utf-8")));
  if (
    prev.criteriaVersion === incoming.criteriaVersion &&
    prev.fit === incoming.fit &&
    prev.scoredAt === incoming.scoredAt
  ) {
    return;
  }
  const versionDir = join(ARCHIVE_DIR, prev.criteriaVersion ?? "unknown");
  if (!existsSync(versionDir)) mkdirSync(versionDir, { recursive: true });
  const stamp = prev.scoredAt.replace(/[:.]/g, "-");
  const dest = join(versionDir, `${ref}-${stamp}.json`);
  copyFileSync(p, dest);
}

export function saveScore(score: ThesisScore) {
  ensureScoresDir();
  const stamped: ThesisScore = {
    ...score,
    criteriaVersion: score.criteriaVersion ?? CRITERIA_VERSION,
  };
  archiveScoreIfChanged(stamped.ref, stamped);
  writeFileSync(scorePath(stamped.ref), JSON.stringify(stamped, null, 2));
}

export function loadScore(ref: string): ThesisScore | null {
  const p = scorePath(ref);
  if (!existsSync(p)) return null;
  const base = normalizeThesisScore(JSON.parse(readFileSync(p, "utf-8")));
  return applyOverrideToScore(base, loadOverride(ref));
}

export function loadAllScores(): ThesisScore[] {
  ensureScoresDir();
  const files = readdirSync(SCORES_DIR).filter(
    (f) => f.endsWith(".json") && !f.startsWith(".")
  );
  return files
    .map((f) => {
      const ref = f.replace(/\.json$/, "");
      return loadScore(ref);
    })
    .filter((s): s is ThesisScore => s !== null)
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
  const { generateRankingMarkdown } =
    require("./markdown") as typeof import("./markdown");
  writeFileSync(
    join(process.cwd(), "RANKING.md"),
    generateRankingMarkdown(state)
  );
}

export function researchPath(ref: string) {
  return join(RESEARCH_DIR, `${ref}.json`);
}

export function saveResearch(ref: string, data: unknown) {
  if (!existsSync(RESEARCH_DIR)) mkdirSync(RESEARCH_DIR, { recursive: true });
  writeFileSync(researchPath(ref), JSON.stringify(data, null, 2));
}

export function loadResearch(ref: string): unknown | null {
  const p = researchPath(ref);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8"));
}
