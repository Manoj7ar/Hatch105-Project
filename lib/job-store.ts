import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Thesis } from "./types";
import { getWritableRoot } from "./writable-root";

export type JobItemStatus = "pending" | "running" | "done" | "failed";

export type BatchJobItem = {
  ref: string;
  title?: string;
  status: JobItemStatus;
  error?: string;
};

export type BatchJob = {
  id: string;
  items: BatchJobItem[];
  theses: Thesis[];
  done: boolean;
  createdAt: string;
};

const memory = new Map<string, BatchJob>();

function jobsDir(): string {
  return join(getWritableRoot(), ".jobs");
}

function jobPath(id: string) {
  return join(jobsDir(), `${id}.json`);
}

function ensureJobsDir(): boolean {
  try {
    const dir = jobsDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

export function createJob(theses: Thesis[]): BatchJob {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: BatchJob = {
    id,
    items: theses.map((t) => ({
      ref: t.ref,
      title: t.title,
      status: "pending",
    })),
    theses,
    done: false,
    createdAt: new Date().toISOString(),
  };
  memory.set(id, job);
  persistJob(job);
  return job;
}

export function getJob(id: string): BatchJob | null {
  if (memory.has(id)) return memory.get(id)!;

  const p = jobPath(id);
  if (!existsSync(p)) return null;

  try {
    const raw = JSON.parse(readFileSync(p, "utf-8")) as BatchJob & {
      theses?: Thesis[];
    };
    const job: BatchJob = {
      ...raw,
      theses: raw.theses ?? [],
    };
    memory.set(id, job);
    return job;
  } catch {
    return null;
  }
}

export function updateJob(job: BatchJob) {
  memory.set(job.id, job);
  persistJob(job);
}

function persistJob(job: BatchJob) {
  if (!ensureJobsDir()) return;
  try {
    writeFileSync(jobPath(job.id), JSON.stringify(job, null, 2));
  } catch {
    /* memory-only fallback on read-only FS */
  }
}
