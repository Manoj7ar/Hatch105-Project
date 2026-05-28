import type { Thesis } from "./types";
import { scoreThesisForRanking } from "./score-pipeline";
import {
  saveScoreAsync,
  loadCandidateTheses,
  getRankingStateAsync,
  mergeExtraThesesAsync,
} from "./data";
import { placementSummary } from "./rank";
import { generateRankingMarkdown } from "./markdown";
import { writeFileSync } from "fs";
import { join } from "path";
import { createJob, getJob, updateJob, type BatchJob } from "./job-store";

export async function runBatchScore(
  jobId: string,
  theses: Thesis[],
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
      const score = await scoreThesisForRanking(thesis);
      await saveScoreAsync(score);
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

export async function startBatchJob(
  theses: Thesis[],
  opts?: { resumeFailed?: boolean; existingJobId?: string }
): Promise<BatchJob> {
  let job: BatchJob;

  if (opts?.existingJobId) {
    const existing = getJob(opts.existingJobId);
    if (!existing) {
      job = createJob(theses);
    } else {
      job = existing;
      theses = existing.theses.length ? existing.theses : theses;
    }
  } else {
    job = createJob(theses);
  }

  await runBatchScore(job.id, theses, opts?.resumeFailed ?? false);

  const finished = getJob(job.id);
  if (!finished) throw new Error("Batch job lost after scoring");
  return finished;
}

export async function finalizeRanking(
  newRefs: string[],
  extraTheses: Thesis[] = []
) {
  const base = loadCandidateTheses();
  const added = extraTheses.filter((n) => !base.some((b) => b.ref === n.ref));
  await mergeExtraThesesAsync(added);

  const state = await getRankingStateAsync();
  const placements = placementSummary(state.ranked, newRefs);
  const markdown = generateRankingMarkdown(state);
  try {
    writeFileSync(join(process.cwd(), "RANKING.md"), markdown);
  } catch {
    /* read-only fs */
  }
  return { state, placements, markdown };
}
