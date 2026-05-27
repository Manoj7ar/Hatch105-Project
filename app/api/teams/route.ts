import { NextResponse } from "next/server";
import { getTeamsFromRanking } from "@/lib/teams";
import { getRankingState } from "@/lib/data";

export async function GET() {
  try {
    const { ranked } = getRankingState();
    const teams = getTeamsFromRanking(ranked).map(
      ({ ref, title, searchKey, rank, fit, verdict }) => ({
        ref,
        title,
        searchKey,
        rank,
        fit,
        verdict,
      })
    );
    return NextResponse.json({ teams });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load teams";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
