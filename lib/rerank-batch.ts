import type { Thesis } from "./types";
import { scoreThesis, type ScoreContext } from "./scorer";
import { saveScore, loadCandidateTheses, loadScore } from "./data";
import { rankScores, placementSummary } from "./rank";
import { buildRankingState, generateRankingMarkdown } from "./markdown";
import { writeFileSync } from "fs";
import { join } from "path";
import { createJob, getJob, updateJob, type BatchJob } from "./job-store";

export async function runBatchScore(
  jobId: string,
  theses: Thesis[],
  ctx?: ScoreContext,
  onlyFailed = false
) {
  const job = getJob(jobId);
  if (!job) return;

  for (const item of job.items) {
    if (onlyFailed && item.status !== "failed") continue;
    if (!onlyFailed && item.status === "done") continue;

    const thesis = theses.find((t) => t.ref === item.ref);
    if (!thesis) {
      item.status = "failed";
      item.error = "Thesis not found";
      updateJob(job);
      continue;
    }

    item.status = "running";
    item.error = undefined;
    updateJob(job);

    try {
      const score = await scoreThesis(thesis, {
        ...ctx,
        forceGroq: ctx?.forceGroq ?? true,
      });
      saveScore(score);
      item.status = "done";
    } catch (e) {
      item.status = "failed";
      item.error = e instanceof Error ? e.message : "Score failed";
    }
    updateJob(job);
  }

  job.done = job.items.every(
    (i) => i.status === "done" || i.status === "failed"
  );
  updateJob(job);
}

export function startBatchJob(
  theses: Thesis[],
  opts?: { resumeFailed?: boolean; existingJobId?: string }
): BatchJob {
  if (opts?.existingJobId) {
    const existing = getJob(opts.existingJobId);
    if (existing) {
      const list = existing.theses.length ? existing.theses : theses;
      void runBatchScore(existing.id, list, undefined, opts.resumeFailed);
      return existing;
    }
  }
  const job = createJob(theses);
  void runBatchScore(job.id, theses, undefined, false);
  return job;
}

export function finalizeRanking(newRefs: string[], extraTheses: Thesis[] = []) {
  const base = loadCandidateTheses();
  const allTheses = [
    ...base,
    ...extraTheses.filter((n) => !base.some((b) => b.ref === n.ref)),
  ];

  const scores = allTheses
    .map((t) => loadScore(t.ref))
    .filter((s): s is import("./types").ThesisScore => s !== null);

  const ranked = rankScores(scores, allTheses);
  const placements = placementSummary(ranked, newRefs);
  const state = buildRankingState(ranked);
  const markdown = generateRankingMarkdown(state);
  try {
    writeFileSync(join(process.cwd(), "RANKING.md"), markdown);
  } catch {
    /* read-only fs */
  }
  return { state, placements, markdown };
}
