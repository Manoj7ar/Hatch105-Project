import { getRankingState } from "./data";
import type { RankedThesis } from "./types";
import { findTeamsByPrefixFrom } from "./teams-mention";

export type Team = {
  ref: string;
  title: string;
  searchKey: string;
  rank?: number;
  fit?: number;
  verdict?: string;
};

export type TeamOption = Team;

function normalizeSearchKey(title: string, ref: string): string {
  return `${title} ${ref}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function thesisToTeam(row: {
  ref: string;
  title: string;
  rank?: number;
  fit?: number;
  verdict?: string;
}): Team {
  return {
    ref: row.ref,
    title: row.title,
    searchKey: normalizeSearchKey(row.title, row.ref),
    rank: row.rank,
    fit: row.fit,
    verdict: row.verdict,
  };
}

/** Every scored company (base 50 + live re-rank extras) for @mentions and chat. */
export function getAllTeams(): Team[] {
  return getTeamsFromRanking(getRankingState().ranked);
}

export function getTeamsFromRanking(ranked: RankedThesis[]): Team[] {
  return ranked
    .map((r) =>
      thesisToTeam({
        ref: r.ref,
        title: r.title,
        rank: r.rank,
        fit: r.fit,
        verdict: r.verdict,
      })
    )
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function findTeamsByPrefix(query: string, limit = 8): Team[] {
  return findTeamsByPrefixFrom(query, getAllTeams(), limit);
}

/** Expand @TeamName or @H-XX → @TeamName (ref H-XX) for model grounding */
export function expandTeamMentions(text: string): string {
  const teams = getAllTeams().sort((a, b) => {
    const lenA = Math.max(a.title.length, a.ref.length);
    const lenB = Math.max(b.title.length, b.ref.length);
    return lenB - lenA;
  });
  if (!teams.length || !text.includes("@")) return text;

  type Span = { start: number; end: number; team: Team };
  const spans: Span[] = [];

  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "@") continue;
    const after = text.slice(i + 1);
    for (const team of teams) {
      const refHit = after.toLowerCase().startsWith(team.ref.toLowerCase());
      const titleHit = after.startsWith(team.title);
      if (!refHit && !titleHit) continue;

      const end = refHit
        ? i + 1 + team.ref.length
        : i + 1 + team.title.length;
      const tail = text.slice(end);
      if (tail.startsWith(" (ref ")) break;
      spans.push({ start: i, end, team });
      break;
    }
  }

  if (!spans.length) return text;

  const merged: Span[] = [];
  for (const s of spans.sort((a, b) => a.start - b.start)) {
    const last = merged[merged.length - 1];
    if (last && s.start < last.end) continue;
    merged.push(s);
  }

  let out = "";
  let cursor = 0;
  for (const { start, end, team } of merged) {
    out += text.slice(cursor, end);
    out += ` (ref ${team.ref})`;
    cursor = end;
  }
  out += text.slice(cursor);
  return out;
}

export function formatTeamLabel(
  team: Pick<Team, "title" | "rank" | "fit">,
  opts?: { showRank?: boolean }
): string {
  if (opts?.showRank && team.rank != null) {
    const fit = team.fit != null ? ` · fit ${team.fit}` : "";
    return `${team.title} · #${team.rank}${fit}`;
  }
  return team.title;
}
