import { CRITERION_KEYS, type RankedThesis } from "@/lib/types";
import { CRITERION_LABELS } from "@/lib/criteria";
import type { CohortBenchmarks } from "@/lib/thesis-detail";

export function CriterionCompareBars({
  thesis,
  benchmarks,
}: {
  thesis: RankedThesis;
  benchmarks: CohortBenchmarks;
}) {
  return (
    <figure className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <figcaption className="hatch-label mb-4">vs cohort average</figcaption>
      <ul className="space-y-4" role="list">
        {CRITERION_KEYS.map((key) => {
          const team = thesis.criteria[key].score;
          const cohort = benchmarks.criterionAverages[key];
          const delta = Math.round((team - cohort) * 10) / 10;
          return (
            <li key={key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
                <span className="font-medium text-slate-700">
                  {CRITERION_LABELS[key]}
                </span>
                <span className="font-mono text-slate-500">
                  {team}{" "}
                  <span
                    className={
                      delta >= 0 ? "text-emerald-600" : "text-amber-700"
                    }
                  >
                    ({delta >= 0 ? "+" : ""}
                    {delta})
                  </span>
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-[10px] text-slate-600">
                    Team
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-600"
                      style={{ width: `${(team / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-[10px] text-slate-400">
                    Avg
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-400"
                      style={{ width: `${(cohort / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
