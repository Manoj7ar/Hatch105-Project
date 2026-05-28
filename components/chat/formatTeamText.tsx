"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ideaPath } from "@/lib/idea-path";
import { resolveTeamTitleToRef } from "@/lib/teams-mention";

const REF_PATTERN = /(\*\*)?(H-\d{1,3})(\*\*)?/gi;

export function formatTeamText(
  text: string,
  teamTitles: string[] = [],
  teams: { ref: string; title: string }[] = []
): ReactNode[] {
  const parts: ReactNode[] = [];
  const sortedTitles = [...teamTitles].sort((a, b) => b.length - a.length);

  type Match = { index: number; length: number; node: ReactNode };
  const matches: Match[] = [];

  let m: RegExpExecArray | null;
  const refRe = new RegExp(REF_PATTERN.source, "g");
  while ((m = refRe.exec(text)) !== null) {
    const ref = m[2]!;
    matches.push({
      index: m.index,
      length: m[0].length,
      node: (
        <Link
          key={`ref-${m.index}`}
          href={ideaPath(ref)}
          className="rounded bg-[#fff0eb] px-1.5 py-0.5 font-mono text-xs font-medium text-[var(--groq-orange)] hover:underline"
        >
          {ref}
        </Link>
      ),
    });
  }

  for (const title of sortedTitles) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const teamRef = resolveTeamTitleToRef(title, teams);

    const atRe = new RegExp(`@${escaped}`, "g");
    while ((m = atRe.exec(text)) !== null) {
      const inner = (
        <span className="rounded-full bg-[var(--groq-orange)] px-2 py-0.5 text-xs font-medium text-white">
          @{title}
        </span>
      );
      matches.push({
        index: m.index,
        length: m[0].length,
        node: teamRef ? (
          <Link key={`at-${m.index}`} href={ideaPath(teamRef)} className="inline">
            {inner}
          </Link>
        ) : (
          inner
        ),
      });
    }

    const boldRe = new RegExp(`\\*\\*${escaped}\\*\\*`, "g");
    while ((m = boldRe.exec(text)) !== null) {
      const inner = (
        <span className="font-semibold text-[#0d0d0d]">{title}</span>
      );
      matches.push({
        index: m.index,
        length: m[0].length,
        node: teamRef ? (
          <Link key={`bold-${m.index}`} href={ideaPath(teamRef)} className="hover:underline">
            {inner}
          </Link>
        ) : (
          inner
        ),
      });
    }
  }

  matches.sort((a, b) => a.index - b.index);

  const merged: Match[] = [];
  for (const match of matches) {
    const last = merged[merged.length - 1];
    if (last && match.index < last.index + last.length) continue;
    merged.push(match);
  }

  let cursor = 0;
  for (const match of merged) {
    if (match.index > cursor) {
      parts.push(text.slice(cursor, match.index));
    }
    parts.push(match.node);
    cursor = match.index + match.length;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts.length > 0 ? parts : [text];
}
