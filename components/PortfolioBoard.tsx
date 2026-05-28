"use client";

import { useState } from "react";
import Link from "next/link";
import type { RankedThesis } from "@/lib/types";
import { usePortfolio, type PortfolioColumn } from "@/hooks/usePortfolio";
import { cn } from "@/lib/utils";
import { ideaPath } from "@/lib/idea-path";

const COLUMNS: { id: PortfolioColumn; label: string }[] = [
  { id: "considering", label: "Considering" },
  { id: "building", label: "Building" },
  { id: "passed", label: "Passed" },
];

export function PortfolioBoard({ ranked }: { ranked: RankedThesis[] }) {
  const { state, move } = usePortfolio();
  const [dragOverCol, setDragOverCol] = useState<PortfolioColumn | null>(null);
  const byRef = Object.fromEntries(ranked.map((r) => [r.ref, r]));

  const unassigned = ranked.filter(
    (r) =>
      !state.considering.includes(r.ref) &&
      !state.building.includes(r.ref) &&
      !state.passed.includes(r.ref)
  );

  const onDragStart = (e: React.DragEvent, ref: string) => {
    e.dataTransfer.setData("text/ref", ref);
  };

  const onDrop = (e: React.DragEvent, col: PortfolioColumn) => {
    e.preventDefault();
    setDragOverCol(null);
    const ref = e.dataTransfer.getData("text/ref");
    if (ref) move(ref, col);
  };

  return (
    <div className="space-y-4">
      {unassigned.length > 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 p-4">
          <p className="hatch-label mb-2">Drag into a column</p>
          <ul className="flex flex-wrap gap-2">
            {unassigned.slice(0, 20).map((row) => (
              <li
                key={row.ref}
                draggable
                onDragStart={(e) => onDragStart(e, row.ref)}
                className="hatch-drag-chip cursor-grab rounded-full bg-white px-3 py-1 text-xs font-medium shadow ring-1 ring-slate-200"
              >
                {row.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.id);
            }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => onDrop(e, col.id)}
            className={cn(
              "hatch-drop-target min-h-[240px] rounded-xl border border-slate-200 bg-slate-50/50 p-3",
              dragOverCol === col.id && "hatch-drop-target--over"
            )}
          >
            <h3 className="mb-3 text-sm font-semibold text-slate-700">{col.label}</h3>
            <ul className="space-y-2">
              {state[col.id].map((ref) => {
                const row = byRef[ref];
                if (!row) return null;
                return (
                  <li
                    key={ref}
                    draggable
                    onDragStart={(e) => onDragStart(e, ref)}
                    className="hatch-drag-chip cursor-grab rounded-lg border border-slate-200 bg-white shadow-sm hover:ring-2 hover:ring-[var(--gemini-accent-ring)] active:cursor-grabbing"
                  >
                    <Link
                      href={ideaPath(ref)}
                      className="block p-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-sm font-medium text-slate-900">{row.title}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">
                        #{row.rank} · fit {row.fit}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
