import type { Thesis, ResearchCitation } from "./types";
import { matchCompetitorsInText, formatCompetitorBlock } from "./competitors";
import { checkShopifySurfaces, formatSurfaceFlagsBlock } from "./shopify-surfaces";
import { saveResearch } from "./data";

export type ResearchMode = "grounded" | "external";

export type ResearchResult = {
  ref: string;
  mode: ResearchMode;
  queries: string[];
  citations: ResearchCitation[];
  at: string;
};

function buildQueries(thesis: Thesis): string[] {
  const competitors = matchCompetitorsInText(`${thesis.wedge} ${thesis.title}`);
  const vsName = competitors[0]?.aliases[0] ?? "Gorgias";
  return [
    `Shopify app store ${thesis.title}`,
    `${thesis.title} vs ${vsName}`,
    `${thesis.one_liner} DTC Shopify category`,
  ];
}

function groundedCitations(thesis: Thesis): ResearchCitation[] {
  const blob = `${thesis.wedge} ${thesis.one_liner}`;
  const competitors = matchCompetitorsInText(blob);
  const surfaces = checkShopifySurfaces(thesis);
  const citations: ResearchCitation[] = [];

  citations.push({
    index: 1,
    title: "Thesis wedge (curated)",
    snippet: thesis.wedge.slice(0, 500),
    source: "thesis",
  });

  if (competitors.length > 0) {
    citations.push({
      index: 2,
      title: competitors[0].citeAs,
      snippet: competitors[0].facts.join(" "),
      source: "grounded",
    });
  }

  if (surfaces.length > 0) {
    citations.push({
      index: citations.length + 1,
      title: "Shopify surface check",
      snippet: surfaces.map((s) => s.message).join(" "),
      source: "grounded",
    });
  }

  const competitorBlock = formatCompetitorBlock(competitors);
  if (competitorBlock && citations.length < 3) {
    citations.push({
      index: citations.length + 1,
      title: "Competitor cache",
      snippet: competitorBlock.slice(0, 600),
      source: "grounded",
    });
  }

  return citations.slice(0, 3);
}

async function firecrawlSearch(query: string): Promise<{ title: string; url: string; snippet: string } | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 1,
      }),
    });
    if (!res.ok) {
      console.warn("[research] Firecrawl search failed:", res.status);
      return null;
    }
    const data = (await res.json()) as {
      data?: { title?: string; url?: string; description?: string; markdown?: string }[];
    };
    const hit = data.data?.[0];
    if (!hit) return null;
    return {
      title: hit.title ?? query,
      url: hit.url ?? "",
      snippet: (hit.description ?? hit.markdown ?? "").slice(0, 500),
    };
  } catch (e) {
    console.warn("[research] Firecrawl error:", e);
    return null;
  }
}

async function externalCitations(thesis: Thesis, queries: string[]): Promise<ResearchCitation[]> {
  const citations: ResearchCitation[] = [];
  for (let i = 0; i < queries.length; i++) {
    const hit = await firecrawlSearch(queries[i]);
    if (hit) {
      citations.push({
        index: i + 1,
        title: hit.title,
        url: hit.url,
        snippet: hit.snippet,
        source: "external",
      });
    }
  }
  if (citations.length === 0) {
    return groundedCitations(thesis).map((c) => ({
      ...c,
      title: `${c.title} (Firecrawl unavailable — grounded fallback)`,
    }));
  }
  return citations;
}

export function getDefaultResearchMode(): ResearchMode {
  const m = (process.env.RESEARCH_DEFAULT_MODE ?? "grounded").toLowerCase();
  return m === "external" ? "external" : "grounded";
}

export async function runResearch(
  thesis: Thesis,
  mode?: ResearchMode
): Promise<ResearchResult> {
  const resolved = mode ?? getDefaultResearchMode();
  const queries = buildQueries(thesis);
  const citations =
    resolved === "external" && process.env.FIRECRAWL_API_KEY
      ? await externalCitations(thesis, queries)
      : groundedCitations(thesis);

  const result: ResearchResult = {
    ref: thesis.ref,
    mode: resolved === "external" && !process.env.FIRECRAWL_API_KEY ? "grounded" : resolved,
    queries,
    citations,
    at: new Date().toISOString(),
  };

  saveResearch(thesis.ref, result);
  return result;
}
