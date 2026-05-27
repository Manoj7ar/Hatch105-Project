"use client";

import type { RankedThesis } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { ChevronRight } from "lucide-react";

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
  onSelect,
}: {
  rows: RankedThesis[];
  newRefs: Set<string>;
  onSelect: (row: RankedThesis) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            <th className="px-4 py-3 font-medium text-slate-500">Rank</th>
            <th className="px-4 py-3 font-medium text-slate-500">Team</th>
            <th className="px-4 py-3 font-medium text-slate-500">Fit</th>
            <th className="px-4 py-3 font-medium text-slate-500">Verdict</th>
            <th className="w-10 px-2 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={row.ref}
              onClick={() => onSelect(row)}
              className={cn(
                "group cursor-pointer transition-colors hover:bg-slate-50",
                newRefs.has(row.ref) && "bg-blue-50/50"
              )}
            >
              <td className="px-4 py-3.5 font-mono text-slate-400">{row.rank}</td>
              <td className="px-4 py-3.5">
                <span className="font-medium text-slate-900">{row.title}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{row.ref}</span>
                  {newRefs.has(row.ref) && (
                    <Badge variant="new">New</Badge>
                  )}
                  {row.scoredWith === "groq" && (
                    <Badge variant="new" className="text-[10px]">
                      Groq
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
              <td className="px-2 py-3.5 text-slate-300 group-hover:text-slate-500">
                <ChevronRight className="h-4 w-4" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
