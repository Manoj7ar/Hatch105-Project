import { NextRequest, NextResponse } from "next/server";
import {
  findThesisByRefAsync,
  getRankingStateAsync,
  loadResearchAsync,
  saveScoreAsync,
} from "@/lib/data";
import { runResearch, getDefaultResearchMode, type ResearchMode } from "@/lib/research";
import { scoreThesisForRanking } from "@/lib/score-pipeline";
import { generateRankingMarkdown } from "@/lib/markdown";

type Params = { params: Promise<{ ref: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { ref } = await params;
  const stored = await loadResearchAsync(ref);
  return NextResponse.json({ research: stored });
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { ref } = await params;
    const body = await req.json().catch(() => ({}));
    const mode = (body.mode as ResearchMode) ?? getDefaultResearchMode();
    const rescore = body.rescore === true;

    const thesis = await findThesisByRefAsync(ref);
    if (!thesis) {
      return NextResponse.json({ error: "Thesis not found" }, { status: 404 });
    }

    const research = await runResearch(thesis, mode);

    let score = null;
    if (rescore) {
      score = await scoreThesisForRanking(thesis, {
        forceGroq: true,
        researchCitations: research.citations,
      });
      await saveScoreAsync(score);
    }

    const state = await getRankingStateAsync();

    return NextResponse.json({
      research,
      score,
      state,
      markdown: generateRankingMarkdown(state),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Research failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
