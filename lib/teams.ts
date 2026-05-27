import { loadCandidateTheses, getRankingState } from "./data";
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

function normalizeSearchKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
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
    searchKey: normalizeSearchKey(row.title),
    rank: row.rank,
    fit: row.fit,
    verdict: row.verdict,
  };
}

export function getAllTeams(): Team[] {
  const theses = loadCandidateTheses();
  const scores = getRankingState().ranked;
  const rankByRef = new Map(scores.map((r) => [r.ref, r]));

  return theses
    .map((t) => {
      const ranked = rankByRef.get(t.ref);
      return thesisToTeam({
        ref: t.ref,
        title: t.title,
        rank: ranked?.rank,
        fit: ranked?.fit,
        verdict: ranked?.verdict,
      });
    })
    .sort((a, b) => a.title.localeCompare(b.title));
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

/** Expand @TeamName → @TeamName (ref H-XX) for model grounding */
export function expandTeamMentions(text: string): string {
  const teams = getAllTeams().sort((a, b) => b.title.length - a.title.length);
  if (!teams.length || !text.includes("@")) return text;

  type Span = { start: number; end: number; team: Team };
  const spans: Span[] = [];

  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "@") continue;
    const after = text.slice(i + 1);
    for (const team of teams) {
      if (!after.startsWith(team.title)) continue;
      const end = i + 1 + team.title.length;
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

