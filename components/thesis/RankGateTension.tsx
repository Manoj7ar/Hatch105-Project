import type { RankGateTension as TensionData } from "@/lib/thesis-insights";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function RankGateTension({ tension }: { tension: TensionData }) {
  return (
    <aside
      className={cn(
        "rounded-xl border px-4 py-3",
        tension.level === "high"
          ? "border-amber-200 bg-amber-50/80"
          : "border-slate-200 bg-slate-50/80"
      )}
      role="note"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
          Rank vs gates
        </p>
        <span className="font-mono text-xs text-slate-600">
          #{tension.rank} · fit {tension.fit}
        </span>
        {tension.gates.map((g) => (
          <Badge key={g} variant="warning" className="font-mono text-[10px]">
            {g}
          </Badge>
        ))}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{tension.summary}</p>
    </aside>
  );
}
