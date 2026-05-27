"use client";

import Link from "next/link";
import { useCompare } from "@/lib/compare-store";
import { X } from "lucide-react";

export function CompareTray() {
  const { refs, remove, clear } = useCompare();
  if (refs.length === 0) return null;

  return (
    <div className="hatch-tray fixed bottom-4 left-1/2 z-40 flex max-w-lg -translate-x-1/2 flex-wrap items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
      <span className="hatch-label text-[10px]">Compare</span>
      {refs.map((ref) => (
        <span
          key={ref}
          className="inline-flex items-center gap-1 rounded-full bg-[#fff0eb] px-2 py-0.5 font-mono text-xs text-[var(--groq-orange)] ring-1 ring-[#f9c4b0]"
        >
          {ref}
          <button
            type="button"
            onClick={() => remove(ref)}
            className="text-[var(--groq-orange-hover)] hover:text-[var(--groq-orange)]"
            aria-label={`Remove ${ref}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Link href="/compare" className="hatch-link ml-1 text-xs">
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
