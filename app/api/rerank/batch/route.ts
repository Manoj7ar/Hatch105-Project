import { NextRequest, NextResponse } from "next/server";
import { parseThesesInput } from "@/lib/parse";
import { loadAllTheses, loadCandidateTheses } from "@/lib/data";
import { startBatchJob, finalizeRanking } from "@/lib/rerank-batch";
import { getJob } from "@/lib/job-store";
import type { Thesis } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let theses: Thesis[] = [];

    if (body.text) {
      theses = parseThesesInput(body.text, body.format ?? "auto");
    } else if (body.refs?.length) {
      const all = loadAllTheses();
      theses = all.filter((t) => body.refs.includes(t.ref));
    } else if (body.theses?.length) {
      theses = body.theses;
    } else {
      theses = loadCandidateTheses();
    }

    if (theses.length === 0) {
      return NextResponse.json({ error: "No theses to score" }, { status: 400 });
    }

    const job = await startBatchJob(theses, {
      resumeFailed: body.resumeFailed,
      existingJobId: body.jobId,
    });

    if (job.done) {
      const newRefs = job.items
        .filter((i) => i.status === "done")
        .map((i) => i.ref);
      const { state, placements, markdown } = finalizeRanking(
        newRefs,
        job.theses ?? []
      );
      return NextResponse.json({
        jobId: job.id,
        job,
        state,
        placements,
        markdown,
        newRefs,
      });
    }

    return NextResponse.json({ jobId: job.id, job });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Batch start failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }
  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.done) {
    const newRefs = job.items.filter((i) => i.status === "done").map((i) => i.ref);
    const { state, placements, markdown } = finalizeRanking(
      newRefs,
      job.theses ?? []
    );
    return NextResponse.json({ job, state, placements, markdown, newRefs });
  }

  return NextResponse.json({ job });
}
