import { NextResponse } from "next/server";
import { getTeamsFromRanking } from "@/lib/teams";
import { getRankingStateAsync } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { ranked } = await getRankingStateAsync();
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
    return NextResponse.json(
      { teams },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load teams";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
