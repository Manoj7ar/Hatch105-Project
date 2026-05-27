import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Thesis } from "./types";

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

const JOBS_DIR = join(process.cwd(), ".jobs");
const memory = new Map<string, BatchJob>();

function jobPath(id: string) {
  return join(JOBS_DIR, `${id}.json`);
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
  const raw = JSON.parse(readFileSync(p, "utf-8")) as BatchJob & {
    theses?: Thesis[];
  };
  const job: BatchJob = {
    ...raw,
    theses: raw.theses ?? [],
  };
  memory.set(id, job);
  return job;
}

export function updateJob(job: BatchJob) {
  memory.set(job.id, job);
  persistJob(job);
}

function persistJob(job: BatchJob) {
  if (!existsSync(JOBS_DIR)) mkdirSync(JOBS_DIR, { recursive: true });
  writeFileSync(jobPath(job.id), JSON.stringify(job, null, 2));
}
