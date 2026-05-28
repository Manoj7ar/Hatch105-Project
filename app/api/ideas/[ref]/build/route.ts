import { NextResponse } from "next/server";
import { getRankingStateAsync } from "@/lib/data";
import {
  ensureThesisProfile,
  isThesisProfileComplete,
} from "@/lib/ensure-thesis-profile";
import { getRankedThesisByRef } from "@/lib/thesis-detail";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ ref: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { ref } = await params;
    const state = await getRankingStateAsync();
    let thesis = getRankedThesisByRef(ref, state.ranked);

    if (!thesis) {
      return NextResponse.json({ error: "Idea not found in ranking" }, { status: 404 });
    }

    const updated = await ensureThesisProfile(ref, thesis);

    return NextResponse.json({
      ref,
      complete: isThesisProfileComplete(updated),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Profile build failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
