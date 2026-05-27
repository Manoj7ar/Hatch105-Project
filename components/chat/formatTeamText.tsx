import type { ReactNode } from "react";

const REF_PATTERN = /(\*\*)?(H-\d{2})(\*\*)?/g;

export function formatTeamText(
  text: string,
  teamTitles: string[] = []
): ReactNode[] {
  const parts: ReactNode[] = [];
  const sortedTitles = [...teamTitles].sort((a, b) => b.length - a.length);

  type Match = { index: number; length: number; node: ReactNode };
  const matches: Match[] = [];

  let m: RegExpExecArray | null;
  const refRe = new RegExp(REF_PATTERN.source, "g");
  while ((m = refRe.exec(text)) !== null) {
    matches.push({
      index: m.index,
      length: m[0].length,
      node: (
        <span
          key={`ref-${m.index}`}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-600"
        >
          {m[2]}
        </span>
      ),
    });
  }

  for (const title of sortedTitles) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const atRe = new RegExp(`@${escaped}`, "g");
    while ((m = atRe.exec(text)) !== null) {
      matches.push({
        index: m.index,
        length: m[0].length,
        node: (
          <span
            key={`at-${m.index}`}
            className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white"
          >
            @{title}
          </span>
        ),
      });
    }
    const boldRe = new RegExp(`\\*\\*${escaped}\\*\\*`, "g");
    while ((m = boldRe.exec(text)) !== null) {
      matches.push({
        index: m.index,
        length: m[0].length,
        node: (
          <span key={`bold-${m.index}`} className="font-semibold text-[#0d0d0d]">
            {title}
          </span>
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
