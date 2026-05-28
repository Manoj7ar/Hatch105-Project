import { NextResponse } from "next/server";
import {
  clearAddedThesesAsync,
  getAddedThesisRefsAsync,
  getRankingStateAsync,
  writeRankingMarkdown,
} from "@/lib/data";
import { generateRankingMarkdown } from "@/lib/markdown";

export async function GET() {
  try {
    const refs = await getAddedThesisRefsAsync();
    return NextResponse.json({ count: refs.length, refs });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not list extras";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { removedRefs } = await clearAddedThesesAsync();
    const state = await getRankingStateAsync();
    const markdown = generateRankingMarkdown(state);
    try {
      writeRankingMarkdown(state);
    } catch {
      /* read-only fs */
    }
    return NextResponse.json({ removedRefs, state, markdown });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Clear failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
