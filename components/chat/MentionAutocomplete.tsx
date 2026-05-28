"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { TeamOption } from "@/lib/teams";

type MentionAutocompleteProps = {
  teams: TeamOption[];
  activeIndex: number;
  onSelect: (team: TeamOption) => void;
  onHover: (index: number) => void;
};

export function MentionAutocomplete({
  teams,
  activeIndex,
  onSelect,
  onHover,
}: MentionAutocompleteProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (teams.length === 0) {
    return (
      <div className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#8e8e8e] shadow-lg">
        No teams match
      </div>
    );
  }

  return (
    <ul
      ref={listRef}
      role="listbox"
      className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-48 overflow-y-auto rounded-xl border border-black/10 bg-white py-1 shadow-lg"
    >
      {teams.map((team, i) => (
        <li key={team.ref} role="presentation">
          <button
            type="button"
            role="option"
            aria-selected={i === activeIndex}
            id={`mention-option-${i}`}
            onMouseEnter={() => onHover(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(team);
            }}
            className={cn(
              "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors",
              i === activeIndex ? "hatch-mention-active" : "hover:bg-slate-50"
            )}
          >
            <span className="text-sm font-medium text-[#0d0d0d]">
              {team.title}
              <span className="ml-1.5 font-normal text-[#8e8e8e]">{team.ref}</span>
            </span>
            {team.rank != null && (
              <span className="text-xs text-[#8e8e8e]">
                #{team.rank}
                {team.fit != null ? ` · fit ${team.fit}` : ""}
                {team.verdict ? ` · ${team.verdict}` : ""}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
