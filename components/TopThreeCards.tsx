import type { RankedThesis } from "@/lib/types";

export function TopThreeCards({ items }: { items: RankedThesis[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((t, i) => (
        <article
          key={t.ref}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <span className="text-xs font-medium text-slate-400">#{i + 1}</span>
          <h3 className="mt-1 font-semibold text-slate-900">{t.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Hatch Fit <span className="font-mono font-semibold text-slate-700">{t.fit}</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{t.verdict}</p>
        </article>
      ))}
    </div>
  );
}
