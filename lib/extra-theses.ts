import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { ThesisSchema, type Thesis, type ThesisScore } from "./types";
import { getWritableRoot } from "./writable-root";

const REPO_EXTRA_THESES = join(process.cwd(), "data", "extra_theses.json");

function writableExtraThesesPath(): string {
  return join(getWritableRoot(), "extra_theses.json");
}

function extraThesesReadPaths(): string[] {
  const paths = [REPO_EXTRA_THESES, writableExtraThesesPath()];
  return [...new Set(paths)];
}

function extraThesesWritePaths(): string[] {
  return extraThesesReadPaths();
}

export function loadExtraTheses(): Thesis[] {
  const byRef = new Map<string, Thesis>();

  for (const path of extraThesesReadPaths()) {
    if (!existsSync(path)) continue;
    try {
      const raw = JSON.parse(readFileSync(path, "utf-8"));
      const arr = Array.isArray(raw) ? raw : [];
      for (const t of arr) {
        const thesis = ThesisSchema.parse(t);
        byRef.set(thesis.ref, thesis);
      }
    } catch {
      /* skip corrupt file */
    }
  }

  return [...byRef.values()].sort((a, b) => a.ref.localeCompare(b.ref));
}

/** Clear persisted live re-rank thesis rows (does not remove score files). */
export function clearExtraThesesStore(): void {
  const payload = "[]\n";
  for (const path of extraThesesWritePaths()) {
    try {
      const dir = dirname(path);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(path, payload);
    } catch {
      /* skip read-only targets */
    }
  }
}

/** Persist live re-rank theses (repo data/ + writable root when different). */
export function mergeExtraTheses(incoming: Thesis[]): void {
  if (incoming.length === 0) return;

  const byRef = new Map(loadExtraTheses().map((t) => [t.ref, t]));
  for (const t of incoming) byRef.set(t.ref, t);

  const merged = [...byRef.values()].sort((a, b) => a.ref.localeCompare(b.ref));
  const payload = JSON.stringify(merged, null, 2);

  for (const path of extraThesesWritePaths()) {
    try {
      const dir = dirname(path);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(path, payload);
    } catch {
      /* skip read-only targets (e.g. Vercel bundle) */
    }
  }
}

/** Minimal thesis when only scores/H-XX.json exists (legacy or partial write). */
export function thesisStubFromScore(score: ThesisScore): Thesis {
  return ThesisSchema.parse({
    ref: score.ref,
    title: score.title,
    one_liner:
      score.trapNote?.slice(0, 200) ||
      "Live re-rank import (full thesis in extra_theses.json)",
    example_customer: "See score file",
    wedge: score.technicalSnapshot?.slice(0, 300) || "Added via live re-rank",
  });
}
