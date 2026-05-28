import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import {
  ThesisSchema,
  normalizeThesisScore,
  type ResearchCitation,
  type Thesis,
  type ThesisScore,
} from "./types";
import { rankScores } from "./rank";
import { buildRankingState } from "./markdown";
import type { RankingState } from "./types";
import { CRITERIA_VERSION } from "./criteria-version";
import {
  applyOverrideToScore,
  deleteOverride,
  loadOverride,
} from "./override";
import {
  clearExtraThesesStore,
  loadExtraTheses,
  mergeExtraTheses,
  thesisStubFromScore,
} from "./extra-theses";
import { getWritableRoot, isEphemeralWritableRoot } from "./writable-root";

export { loadExtraTheses, mergeExtraTheses };

const REPO_SCORES_DIR = join(process.cwd(), "scores");
export const INITIAL_DATASET_DIR = join(process.cwd(), "Initial-dataset");

function scoresWriteDir(): string {
  return join(getWritableRoot(), "scores");
}

/** Overlay (tmp) first, then committed repo scores on serverless. */
function scoresReadDirs(): string[] {
  const writeDir = scoresWriteDir();
  if (!isEphemeralWritableRoot() || writeDir === REPO_SCORES_DIR) {
    return [REPO_SCORES_DIR];
  }
  return [writeDir, REPO_SCORES_DIR];
}

function researchDir(): string {
  return join(getWritableRoot(), "research");
}

export function loadCandidateTheses(): Thesis[] {
  const path = join(INITIAL_DATASET_DIR, "candidate_theses.json");
  const raw = readFileSync(path, "utf-8");
  const data = JSON.parse(raw);
  return data.map((t: unknown) => ThesisSchema.parse(t));
}

/** Base 50 + persisted extras + optional in-memory batch rows + score stubs. */
export function loadAllTheses(extraTheses?: Thesis[]): Thesis[] {
  const thesisByRef = new Map<string, Thesis>();

  for (const t of loadCandidateTheses()) thesisByRef.set(t.ref, t);
  for (const t of loadExtraTheses()) thesisByRef.set(t.ref, t);
  for (const t of extraTheses ?? []) thesisByRef.set(t.ref, t);
  for (const score of loadAllScores()) {
    if (!thesisByRef.has(score.ref)) {
      thesisByRef.set(score.ref, thesisStubFromScore(score));
    }
  }

  return [...thesisByRef.values()].sort((a, b) => a.ref.localeCompare(b.ref));
}

export function findThesisByRef(ref: string): Thesis | null {
  const norm = ref.trim().toUpperCase();
  return loadAllTheses().find((t) => t.ref.toUpperCase() === norm) ?? null;
}

export function ensureScoresDir() {
  const dir = scoresWriteDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function scorePath(ref: string) {
  return join(scoresWriteDir(), `${ref}.json`);
}

function archiveScoreIfChanged(ref: string, incoming: ThesisScore) {
  const p = scorePath(ref);
  if (!existsSync(p)) return;
  let prev: ThesisScore;
  try {
    prev = normalizeThesisScore(JSON.parse(readFileSync(p, "utf-8")));
  } catch {
    return;
  }
  if (
    prev.criteriaVersion === incoming.criteriaVersion &&
    prev.fit === incoming.fit &&
    prev.scoredAt === incoming.scoredAt
  ) {
    return;
  }
  const archiveDir = join(scoresWriteDir(), "archive", prev.criteriaVersion ?? "unknown");
  try {
    if (!existsSync(archiveDir)) mkdirSync(archiveDir, { recursive: true });
    const stamp = prev.scoredAt.replace(/[:.]/g, "-");
    copyFileSync(p, join(archiveDir, `${ref}-${stamp}.json`));
  } catch {
    /* skip archive on read-only / ephemeral FS */
  }
}

function citationsFromStoredResearch(ref: string): ResearchCitation[] | undefined {
  const stored = loadResearch(ref);
  if (!stored || typeof stored !== "object") return undefined;
  const citations = (stored as { citations?: ResearchCitation[] }).citations;
  return citations?.length ? citations : undefined;
}

/** Attach saved research/*.json citations when the score file omits them. */
export function enrichScoreWithStoredResearch(score: ThesisScore): ThesisScore {
  if (score.researchCitations?.length) return score;
  const citations = citationsFromStoredResearch(score.ref);
  if (!citations) return score;
  return { ...score, researchCitations: citations };
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
  for (const dir of scoresReadDirs()) {
    const p = join(dir, `${ref}.json`);
    if (!existsSync(p)) continue;
    const base = normalizeThesisScore(JSON.parse(readFileSync(p, "utf-8")));
    const withOverride = applyOverrideToScore(base, loadOverride(ref));
    return withOverride
      ? enrichScoreWithStoredResearch(withOverride)
      : null;
  }
  return null;
}

export function loadAllScores(): ThesisScore[] {
  const byRef = new Map<string, ThesisScore>();
  for (const dir of scoresReadDirs()) {
    if (!existsSync(dir)) continue;
    let files: string[];
    try {
      files = readdirSync(dir).filter(
        (f) => f.endsWith(".json") && !f.startsWith(".")
      );
    } catch {
      continue;
    }
    for (const f of files) {
      const ref = f.replace(/\.json$/, "");
      if (byRef.has(ref)) continue;
      const p = join(dir, `${ref}.json`);
      if (!existsSync(p)) continue;
      const base = normalizeThesisScore(JSON.parse(readFileSync(p, "utf-8")));
      const s = applyOverrideToScore(base, loadOverride(ref));
      if (s) byRef.set(ref, enrichScoreWithStoredResearch(s));
    }
  }
  return [...byRef.values()].sort((a, b) => a.ref.localeCompare(b.ref));
}

export function getRankingState(extraTheses?: Thesis[]): RankingState {
  const allTheses = loadAllTheses(extraTheses);
  const scores = loadAllScores();

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
  const ephemeral = join(researchDir(), `${ref}.json`);
  const repo = join(process.cwd(), "research", `${ref}.json`);
  if (existsSync(ephemeral)) return ephemeral;
  return repo;
}

export function saveResearch(ref: string, data: unknown) {
  const dir = researchDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${ref}.json`), JSON.stringify(data, null, 2));
}

export function loadResearch(ref: string): unknown | null {
  const p = researchPath(ref);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8"));
}

export function baseThesisRefs(): Set<string> {
  return new Set(loadCandidateTheses().map((t) => t.ref));
}

/** Refs from live re-rank (extras file and/or scores outside the base 50). */
export function getAddedThesisRefs(): string[] {
  const base = baseThesisRefs();
  const refs = new Set<string>();

  for (const t of loadExtraTheses()) {
    if (!base.has(t.ref)) refs.add(t.ref);
  }
  for (const score of loadAllScores()) {
    if (!base.has(score.ref)) refs.add(score.ref);
  }

  return [...refs].sort((a, b) => a.localeCompare(b));
}

function deleteScoreForRef(ref: string): void {
  for (const dir of scoresReadDirs()) {
    const p = join(dir, `${ref}.json`);
    if (!existsSync(p)) continue;
    try {
      unlinkSync(p);
    } catch {
      /* skip read-only */
    }
  }
}

function deleteResearchForRef(ref: string): void {
  const paths = [
    join(researchDir(), `${ref}.json`),
    join(process.cwd(), "research", `${ref}.json`),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      unlinkSync(p);
    } catch {
      /* skip */
    }
  }
}

/** Remove all live re-rank additions; returns to the base 50 ranking. */
export function clearAddedTheses(): { removedRefs: string[] } {
  const removedRefs = getAddedThesisRefs();
  clearExtraThesesStore();

  for (const ref of removedRefs) {
    deleteScoreForRef(ref);
    deleteResearchForRef(ref);
    deleteOverride(ref);
  }

  return { removedRefs };
}
