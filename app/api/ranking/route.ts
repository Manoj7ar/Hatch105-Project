import { NextResponse } from "next/server";
import { getRankingState } from "@/lib/data";
import { generateRankingMarkdown } from "@/lib/markdown";

export async function GET() {
  try {
    const state = getRankingState();
    return NextResponse.json({
      state,
      markdown: generateRankingMarkdown(state),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load ranking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
