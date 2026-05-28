"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { RankedThesis } from "@/lib/types";
import type { CohortBenchmarks } from "@/lib/thesis-detail";
import { Badge } from "@/components/ui/Badge";

type BuildPhase = "starting" | "research" | "scoring" | "done" | "error";

export function ThesisDetailBuilding({
  refId,
  thesis,
  benchmarks,
}: {
  refId: string;
  thesis: RankedThesis;
  benchmarks: CohortBenchmarks;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<BuildPhase>("starting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setPhase("research");
      setError(null);
      try {
        const res = await fetch(`/api/ideas/${encodeURIComponent(refId)}/build`, {
          method: "POST",
        });
        const data = (await res.json()) as {
          error?: string;
          complete?: boolean;
        };
        if (cancelled) return;
        if (!res.ok) {
          setPhase("error");
          setError(data.error ?? "Profile build failed");
          return;
        }
        setPhase(data.complete ? "done" : "scoring");
        router.refresh();
      } catch (e) {
        if (cancelled) return;
        setPhase("error");
        setError(e instanceof Error ? e.message : "Network error");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [refId, router]);

  const statusLabel =
    phase === "starting"
      ? "Preparing…"
      : phase === "research"
        ? "Running grounded research…"
        : phase === "scoring"
          ? "Scoring with Groq (deep dive, v1 plan, citations)…"
          : phase === "done"
            ? "Profile ready — refreshing…"
            : "Build failed";

  return (
    <article className="thesis-detail space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        All rankings
      </Link>

      <header className="space-y-4">
        <p className="hatch-label">Company profile</p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {thesis.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-slate-400">{thesis.ref}</span>
            {thesis.rank > 0 && (
              <span className="hatch-chip">Rank #{thesis.rank}</span>
            )}
            <Badge variant="muted">{thesis.verdict}</Badge>
            <Badge variant="default">fit {thesis.fit}</Badge>
          </div>
        </div>
      </header>

      <div
        className="rounded-xl border border-amber-200 bg-amber-50/80 px-6 py-8"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-4">
          {phase !== "error" && (
            <Loader2 className="mt-0.5 h-6 w-6 shrink-0 animate-spin text-amber-700" />
          )}
          <div className="space-y-2">
            <p className="text-lg font-medium text-amber-950">
              Building full company profile
            </p>
            <p className="text-sm text-amber-900/90">{statusLabel}</p>
            <p className="text-sm text-amber-800/80">
              This idea was added via Live re-rank. We are generating the same
              sections as the base dataset — research citations, technical
              snapshot, v1 plan, and deep dive — so the page matches the rest of
              the library. This usually takes under a minute.
            </p>
            {error && (
              <p className="text-sm font-medium text-red-700">{error}</p>
            )}
            {!error && (
              <p className="text-xs text-amber-800/70">
                Cohort median fit: {benchmarks.medianFit} · {benchmarks.count}{" "}
                ranked ideas
              </p>
            )}
          </div>
        </div>
      </div>

      {thesis.thesis?.one_liner && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Preview
          </h2>
          <p className="text-slate-700">{thesis.thesis.one_liner}</p>
        </section>
      )}
    </article>
  );
}
