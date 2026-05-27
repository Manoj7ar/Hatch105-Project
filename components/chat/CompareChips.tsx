"use client";

import { useCompare } from "@/lib/compare-store";
import { resolveTeamTitleToRef } from "@/lib/teams-mention";

export function CompareChips({
  teams,
  titlesInMessage,
}: {
  teams: { ref: string; title: string }[];
  titlesInMessage: string[];
}) {
  const { add } = useCompare();
  const unique = [...new Set(titlesInMessage)].filter((t) =>
    teams.some((tt) => tt.title.toLowerCase() === t.toLowerCase())
  );

  if (unique.length < 2) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
      <span className="text-xs text-slate-500">Add to compare:</span>
      {unique.slice(0, 4).map((title) => (
        <button
          key={title}
          type="button"
          onClick={() => {
            const ref = resolveTeamTitleToRef(title, teams);
            if (ref) add(ref);
          }}
          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
        >
          {title}
        </button>
      ))}
    </div>
  );
}
