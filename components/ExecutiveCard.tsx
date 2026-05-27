import { Download } from "lucide-react";
import type { RankingState } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

type ExecutiveCardProps = {
  state: RankingState;
  onExportRanking?: () => void;
};

export function ExecutiveCard({ state, onExportRanking }: ExecutiveCardProps) {
  const { executivePick: pick } = state;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Recommended build
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {pick.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Hatch Fit{" "}
            <span className="font-mono font-semibold text-slate-700">{pick.fit}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onExportRanking && (
            <Button
              type="button"
              variant="ghost"
              onClick={onExportRanking}
              className="shrink-0 px-2.5 text-slate-600"
              title="Download RANKING.md"
            >
              <Download className="h-4 w-4" aria-hidden />
              Export ranking
            </Button>
          )}
          <Badge variant={pick.fit >= 4.2 ? "success" : "default"}>
            {pick.fit >= 4.2 ? "Strong Hatch fit" : "Top pick"}
          </Badge>
        </div>
      </div>

      <p className="mt-5 text-[15px] leading-relaxed text-slate-600">{pick.mvp}</p>
    </section>
  );
}
