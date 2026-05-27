import type { RankedThesis } from "@/lib/types";
import type { CohortBenchmarks } from "@/lib/thesis-detail";
import { getFitPercentile } from "@/lib/thesis-detail";

const MIN_FIT = 1;
const MAX_FIT = 5;

export function FitCohortChart({
  thesis,
  benchmarks,
}: {
  thesis: RankedThesis;
  benchmarks: CohortBenchmarks;
}) {
  const percentile = getFitPercentile(thesis.rank, benchmarks.count);
  const bucketCount = 20;
  const min = Math.min(...benchmarks.fits, thesis.fit);
  const max = Math.max(...benchmarks.fits, thesis.fit);
  const range = Math.max(max - min, 0.5);
  const buckets = Array.from({ length: bucketCount }, () => 0);
  for (const fit of benchmarks.fits) {
    const idx = Math.min(
      bucketCount - 1,
      Math.floor(((fit - min) / range) * bucketCount)
    );
    buckets[idx]! += 1;
  }
  const maxBucket = Math.max(...buckets, 1);

  const posPct = ((thesis.fit - MIN_FIT) / (MAX_FIT - MIN_FIT)) * 100;
  const medianPct =
    ((benchmarks.medianFit - MIN_FIT) / (MAX_FIT - MIN_FIT)) * 100;

  return (
    <figure className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <figcaption className="hatch-label mb-3">Hatch fit in cohort</figcaption>
      <p className="text-3xl font-semibold tabular-nums text-slate-900">
        {thesis.fit}
        <span className="ml-2 text-sm font-normal text-slate-500">
          top {percentile}% · rank {thesis.rank}/{benchmarks.count}
        </span>
      </p>
      <div
        className="relative mt-6 h-3 rounded-full bg-slate-100"
        role="img"
        aria-label={`Hatch fit ${thesis.fit} on a 1 to 5 scale; cohort median ${benchmarks.medianFit}`}
      >
        <div
          className="absolute top-0 h-full w-0.5 -translate-x-1/2 bg-slate-400"
          style={{ left: `${medianPct}%` }}
          title={`Cohort median ${benchmarks.medianFit}`}
        />
        <div
          className="absolute -top-1 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-slate-700 shadow-sm"
          style={{ left: `${Math.min(100, Math.max(0, posPct))}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>1.0</span>
        <span>Median {benchmarks.medianFit}</span>
        <span>5.0</span>
      </div>
      <div className="mt-4 flex h-16 items-end gap-0.5" aria-hidden>
        {buckets.map((count, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-slate-200"
            style={{ height: `${(count / maxBucket) * 100}%` }}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Distribution of {benchmarks.count} teams · mean {benchmarks.meanFit}
      </p>
    </figure>
  );
}
