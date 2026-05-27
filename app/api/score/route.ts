import { NextRequest, NextResponse } from "next/server";
import { ThesisSchema } from "@/lib/types";
import { scoreThesis } from "@/lib/scorer";
import { saveScore } from "@/lib/data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const thesis = ThesisSchema.parse(body);
    const score = await scoreThesis(thesis);
    saveScore(score);
    return NextResponse.json(score);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Score failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
