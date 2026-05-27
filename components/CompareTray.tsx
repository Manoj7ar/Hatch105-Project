"use client";

import Link from "next/link";
import { useCompare } from "@/lib/compare-store";
import { X } from "lucide-react";

export function CompareTray() {
  const { refs, remove, clear } = useCompare();
  if (refs.length === 0) return null;

  return (
    <div className="hatch-tray fixed bottom-4 left-1/2 z-40 flex max-w-lg -translate-x-1/2 flex-wrap items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Compare
      </span>
      {refs.map((ref) => (
        <span
          key={ref}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 ring-1 ring-slate-200"
        >
          {ref}
          <button
            type="button"
            onClick={() => remove(ref)}
            className="text-slate-400 hover:text-slate-700"
            aria-label={`Remove ${ref}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Link
        href="/compare"
        className="ml-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline"
      >
        Open ({refs.length})
      </Link>
      <button
        type="button"
        onClick={clear}
        className="text-xs text-slate-400 hover:text-slate-600"
      >
        Clear
      </button>
    </div>
  );
}
