import Link from "next/link";
import type { SimilarThesis } from "@/lib/thesis-insights";
import { ideaPath } from "@/lib/idea-path";

export function SimilarTheses({ neighbors }: { neighbors: SimilarThesis[] }) {
  if (neighbors.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="hatch-label">Similar in cohort</h2>
      <p className="mt-1 text-xs text-slate-500">
        Closest criterion profile among the other {neighbors.length} teams shown
      </p>
      <ul className="mt-4 divide-y divide-slate-100">
        {neighbors.map(({ thesis, closestCriterion }) => (
          <li key={thesis.ref} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <Link
                href={ideaPath(thesis.ref)}
                className="font-medium text-slate-900 hover:underline"
              >
                {thesis.title}
              </Link>
              <p className="mt-0.5 text-xs text-slate-500">
                <span className="font-mono">{thesis.ref}</span>
                {" · "}
                rank #{thesis.rank}
                {" · "}
                nearest on {closestCriterion}
              </p>
            </div>
            <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-slate-800">
              {thesis.fit}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
