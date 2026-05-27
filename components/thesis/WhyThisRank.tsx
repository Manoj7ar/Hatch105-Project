import type { WhyThisRank as WhyThisRankData } from "@/lib/thesis-insights";

export function WhyThisRank({ insight }: { insight: WhyThisRankData }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
      <h2 className="hatch-label">Why this rank</h2>
      <p className="mt-2 text-[15px] font-medium leading-relaxed text-slate-900">
        {insight.headline}
      </p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Strongest vs cohort
          </dt>
          <dd className="mt-1 text-sm text-slate-700">
            <span className="font-medium text-slate-900">{insight.lift.label}</span>
            {insight.lift.delta > 0 && (
              <span className="font-mono text-emerald-700"> +{insight.lift.delta}</span>
            )}
            <p className="mt-1 text-slate-600">{insight.lift.reason}</p>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-amber-800">
            Weakest vs cohort
          </dt>
          <dd className="mt-1 text-sm text-slate-700">
            <span className="font-medium text-slate-900">{insight.drag.label}</span>
            {insight.drag.delta !== 0 && (
              <span className="font-mono text-amber-800">
                {" "}
                {insight.drag.delta > 0 ? "+" : ""}
                {insight.drag.delta}
              </span>
            )}
            <p className="mt-1 text-slate-600">{insight.drag.reason}</p>
          </dd>
        </div>
      </dl>
      {insight.gatesLine && (
        <p className="mt-3 border-t border-slate-200/80 pt-3 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Hard gates: </span>
          {insight.gatesLine}
        </p>
      )}
      {insight.rankContext && (
        <p className="mt-2 text-xs text-slate-500">{insight.rankContext}</p>
      )}
    </section>
  );
}
