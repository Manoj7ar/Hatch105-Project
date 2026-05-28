import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { ThesisSchema, type Thesis, type ThesisScore } from "./types";
import { persistGet, persistPut } from "./persist";
import { getWritableRoot } from "./writable-root";

const REPO_EXTRA_THESES = join(process.cwd(), "data", "extra_theses.json");
const EXTRA_BLOB_PATH = "extra_theses.json";

function writableExtraThesesPath(): string {
  return join(getWritableRoot(), "extra_theses.json");
}

function extraThesesReadPaths(): string[] {
  return [...new Set([REPO_EXTRA_THESES, writableExtraThesesPath()])];
}

function extraThesesWritePaths(): string[] {
  return extraThesesReadPaths();
}

function parseExtraThesesPayload(raw: string): Thesis[] {
  const data = JSON.parse(raw);
  const arr = Array.isArray(data) ? data : [];
  return arr.map((t: unknown) => ThesisSchema.parse(t));
}

function mergeThesisMaps(sources: Thesis[][]): Thesis[] {
  const byRef = new Map<string, Thesis>();
  for (const list of sources) {
    for (const t of list) byRef.set(t.ref, t);
  }
  return [...byRef.values()].sort((a, b) => a.ref.localeCompare(b.ref));
}

function readExtraThesesFromPath(path: string): Thesis[] {
  if (!existsSync(path)) return [];
  try {
    return parseExtraThesesPayload(readFileSync(path, "utf-8"));
  } catch {
    return [];
  }
}

export function loadExtraTheses(): Thesis[] {
  const lists = extraThesesReadPaths().map(readExtraThesesFromPath);
  return mergeThesisMaps(lists);
}

export async function loadExtraThesesAsync(): Promise<Thesis[]> {
  const lists: Thesis[][] = extraThesesReadPaths().map(readExtraThesesFromPath);
  const blobText = await persistGet(EXTRA_BLOB_PATH);
  if (blobText) {
    try {
      lists.push(parseExtraThesesPayload(blobText));
    } catch {
      /* skip corrupt blob */
    }
  }
  return mergeThesisMaps(lists);
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

export async function clearExtraThesesStoreAsync(): Promise<void> {
  clearExtraThesesStore();
  await persistPut(EXTRA_BLOB_PATH, "[]\n");
}

/** Persist live re-rank theses (repo data/ + writable root + Vercel Blob when configured). */
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
      /* skip read-only targets */
    }
  }
}

export async function mergeExtraThesesAsync(incoming: Thesis[]): Promise<void> {
  if (incoming.length === 0) return;

  const existing = await loadExtraThesesAsync();
  const byRef = new Map(existing.map((t) => [t.ref, t]));
  for (const t of incoming) byRef.set(t.ref, t);

  const merged = [...byRef.values()].sort((a, b) => a.ref.localeCompare(b.ref));
  const payload = JSON.stringify(merged, null, 2);

  for (const path of extraThesesWritePaths()) {
    try {
      const dir = dirname(path);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(path, payload);
    } catch {
      /* skip read-only targets */
    }
  }
  await persistPut(EXTRA_BLOB_PATH, payload);
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
