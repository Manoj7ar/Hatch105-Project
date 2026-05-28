"use client";

import { ChevronDown } from "lucide-react";
import type { RankedThesis } from "@/lib/types";
import type { CohortBenchmarks } from "@/lib/thesis-detail";
import { CRITERION_LABELS } from "@/lib/criteria";
import { passesBuildSprintLens } from "@/lib/thesis-insights";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export function BuildSprintLens({
  thesis,
  benchmarks,
  open,
  onOpenChange,
}: {
  thesis: RankedThesis;
  benchmarks: CohortBenchmarks;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const passes = passesBuildSprintLens(thesis);
  const build = thesis.criteria.buildability;
  const trap = thesis.criteria.trapRisk;
  const buildAvg = benchmarks.criterionAverages.buildability;
  const trapAvg = benchmarks.criterionAverages.trapRisk;

  return (
    <div className="w-full space-y-3">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      >
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
        10-week build lens
      </button>

      {open && (
        <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="hatch-label">10-week build lens</h2>
            <Badge variant={passes ? "success" : "warning"}>
              {passes ? "Passes Hatch sprint bar" : "Below sprint bar"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Buildability ≥ 4 and trap safety ≥ 4 — what a 3-person team can ship and
            sell in one Hatch year.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium text-slate-500">
                {CRITERION_LABELS.buildability}
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
                {build.score}/5
                <span className="ml-2 text-sm font-normal text-slate-500">
                  (cohort {buildAvg})
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium text-slate-500">
                {CRITERION_LABELS.trapRisk}
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
                {trap.score}/5
                <span className="ml-2 text-sm font-normal text-slate-500">
                  (cohort {trapAvg})
                </span>
              </p>
            </div>
          </div>
          {thesis.v1Plan ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["3 days", thesis.v1Plan.day3],
                  ["3 weeks", thesis.v1Plan.week3],
                  ["10 weeks", thesis.v1Plan.week10],
                ] as const
              ).map(([label, body]) => (
                <div
                  key={label}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <dt className="text-xs font-semibold uppercase text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-slate-600">{body}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No v1 timeline in score file — re-score with Gemini for day-3 /
              week-3 / week-10 plan.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
