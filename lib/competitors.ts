import competitorsData from "@/data/competitors.json";

export type CompetitorEntry = {
  id: string;
  aliases: string[];
  citeAs: string;
  facts: string[];
};

const COMPETITORS = competitorsData as CompetitorEntry[];

export function matchCompetitorsInText(text: string): CompetitorEntry[] {
  const lower = text.toLowerCase();
  const hits: CompetitorEntry[] = [];
  for (const c of COMPETITORS) {
    const matched = c.aliases.some((a) => {
      const al = a.toLowerCase();
      return lower.includes(al) || lower.includes(`vs ${al}`) || lower.includes(`vs. ${al}`);
    });
    if (matched) hits.push(c);
  }
  return hits;
}

export function formatCompetitorBlock(entries: CompetitorEntry[]): string {
  if (entries.length === 0) return "";
  const lines = entries.flatMap((c, i) => [
    `[Competitor ${i + 1}] ${c.citeAs}`,
    ...c.facts.map((f) => `  - ${f}`),
  ]);
  return `COMPETITOR CACHE (cite when wedge mentions vs incumbent):\n${lines.join("\n")}`;
}

export function getCompetitorById(id: string): CompetitorEntry | undefined {
  return COMPETITORS.find((c) => c.id === id);
}

export function allCompetitors(): CompetitorEntry[] {
  return COMPETITORS;
}
