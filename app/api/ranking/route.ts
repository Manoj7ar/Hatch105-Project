import { NextResponse } from "next/server";
import { getRankingStateAsync } from "@/lib/data";
import { generateRankingMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getRankingStateAsync();
    return NextResponse.json(
      {
        state,
        markdown: generateRankingMarkdown(state),
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load ranking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
