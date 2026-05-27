"use client";

import { useRouter } from "next/navigation";
import type { RankedThesis } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ideaPath } from "@/lib/idea-path";
import { Badge } from "./ui/Badge";
import { ChevronRight, Plus } from "lucide-react";
import { useCompare } from "@/lib/compare-store";

function verdictVariant(
  verdict: string
): "success" | "warning" | "muted" | "default" {
  if (verdict.includes("Strong")) return "success";
  if (verdict.includes("Viable")) return "default";
  if (verdict.includes("Borderline")) return "warning";
  return "muted";
}

export function RankingTable({
  rows,
  newRefs,
  highlightRef,
}: {
  rows: RankedThesis[];
  newRefs: Set<string>;
  highlightRef?: string;
}) {
  const router = useRouter();
  const { add, has } = useCompare();

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            <th className="px-4 py-3 font-medium text-slate-500">Rank</th>
            <th className="px-4 py-3 font-medium text-slate-500">Team</th>
            <th className="px-4 py-3 font-medium text-slate-500">Fit</th>
            <th className="px-4 py-3 font-medium text-slate-500">Verdict</th>
            <th className="w-16 px-2 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={row.ref}
              onClick={() => router.push(ideaPath(row.ref))}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(ideaPath(row.ref));
              }}
              tabIndex={0}
              role="link"
              className={cn(
                "group cursor-pointer transition-colors hover:bg-slate-50",
                newRefs.has(row.ref) && "hatch-row-new",
                highlightRef === row.ref && "hatch-row-focus"
              )}
            >
              <td className="px-4 py-3.5 font-mono text-slate-400">{row.rank}</td>
              <td className="px-4 py-3.5">
                <span className="font-medium text-slate-900">{row.title}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{row.ref}</span>
                  {newRefs.has(row.ref) && <Badge variant="new">New</Badge>}
                  {row.scoredWith === "human+groq" && (
                    <Badge variant="groq" className="text-[10px]">
                      Human+Groq
                    </Badge>
                  )}
                  {row.overrideNote && (
                    <Badge variant="warning" className="text-[10px]">
                      Override
                    </Badge>
                  )}
                  {row.gatesTriggered.length > 0 && (
                    <span className="font-mono text-xs text-amber-700">
                      {row.gatesTriggered.join(" · ")}
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-flex min-w-[2.5rem] justify-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800">
                  {row.fit}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <Badge variant={verdictVariant(row.verdict)}>{row.verdict}</Badge>
              </td>
              <td className="px-2 py-3.5">
                <button
                  type="button"
                  title="Add to compare"
                  onClick={(e) => {
                    e.stopPropagation();
                    add(row.ref);
                  }}
                  className={cn(
                    "rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-700",
                    has(row.ref) && "text-slate-900"
                  )}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <ChevronRight className="ml-1 inline h-4 w-4 text-slate-300 group-hover:text-[var(--groq-orange)]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
