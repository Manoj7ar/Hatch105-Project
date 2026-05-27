"use client";

import { useState } from "react";
import type { RankedThesis } from "@/lib/types";
import type { CohortBenchmarks } from "@/lib/thesis-detail";
import type {
  WhyThisRank as WhyThisRankData,
  SimilarThesis,
  RankGateTension as TensionData,
} from "@/lib/thesis-insights";
import { WhyThisRank } from "./WhyThisRank";
import { SimilarTheses } from "./SimilarTheses";
import { RankGateTension } from "./RankGateTension";
import { BuildSprintLens } from "./BuildSprintLens";
import { cn } from "@/lib/utils";

export function ThesisDetailBody({
  why,
  similar,
  tension,
  thesis,
  benchmarks,
  rankContextGrid,
  actions,
  charts,
  belowCharts,
}: {
  why: WhyThisRankData;
  similar: SimilarThesis[];
  tension: TensionData | null;
  thesis: RankedThesis;
  benchmarks: CohortBenchmarks;
  rankContextGrid: React.ReactNode;
  actions: React.ReactNode;
  charts: React.ReactNode;
  belowCharts: React.ReactNode;
}) {
  const [lensOpen, setLensOpen] = useState(false);

  return (
    <div className="space-y-6">
      {rankContextGrid}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <BuildSprintLens
          thesis={thesis}
          benchmarks={benchmarks}
          open={lensOpen}
          onOpenChange={setLensOpen}
        />
      </div>

      <WhyThisRank insight={why} />
      {tension && <RankGateTension tension={tension} />}
      <SimilarTheses neighbors={similar} />

      {actions}

      <div className={cn("transition-opacity", lensOpen && "pointer-events-none opacity-50")}>
        {charts}
      </div>

      {belowCharts}
    </div>
  );
}
