import type { Team } from "./teams";

function normalizeSearchKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function wordStartsWithQuery(team: Team, query: string): boolean {
  if (!query) return true;
  const words = team.searchKey.split(/\s+/);
  return words.some((w) => w.startsWith(query));
}

export function findTeamsByPrefixFrom(
  query: string,
  teams: Team[],
  limit = 8
): Team[] {
  const q = normalizeSearchKey(query).replace(/\s+/g, "");

  const scored = teams
    .map((team) => {
      const key = team.searchKey.replace(/\s+/g, "");
      let score = 0;
      if (!q) score = 50;
      else if (key.startsWith(q)) score = 100;
      else if (team.searchKey.includes(q) || wordStartsWithQuery(team, q)) score = 60;
      else if (team.title.toLowerCase().includes(q)) score = 40;
      else return null;
      return { team, score };
    })
    .filter((x): x is { team: Team; score: number } => x !== null)
    .sort((a, b) => b.score - a.score || a.team.title.localeCompare(b.team.title));

  return scored.slice(0, limit).map((s) => s.team);
}

export function getMentionState(
  text: string,
  caretIndex: number,
  teams: Team[]
): { active: boolean; query: string; start: number } | null {
  const before = text.slice(0, caretIndex);
  const at = before.lastIndexOf("@");
  if (at === -1) return null;

  const between = before.slice(at + 1);
  if (between.includes("\n")) return null;

  if (/\s/.test(between)) {
    const partial = between.toLowerCase();
    const matching = teams.some(
      (t) =>
        t.title.toLowerCase().startsWith(partial) ||
        t.title.toLowerCase().includes(partial)
    );
    if (!matching) return null;
  }

  return { active: true, query: between, start: at };
}
