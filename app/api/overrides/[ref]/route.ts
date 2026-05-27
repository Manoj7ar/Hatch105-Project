import { NextRequest, NextResponse } from "next/server";
import {
  loadOverride,
  saveOverride,
  appendOverrideHistory,
  OverrideRecordSchema,
} from "@/lib/override";
import { loadScore } from "@/lib/data";

type Params = { params: Promise<{ ref: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { ref } = await params;
  const override = loadOverride(ref);
  const score = loadScore(ref);
  return NextResponse.json({ override, score });
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { ref } = await params;
    const body = await req.json();
    const existing = loadOverride(ref);
    const at = new Date().toISOString();

    const record = OverrideRecordSchema.parse({
      ref,
      note: body.note ?? existing?.note ?? "",
      author: body.author ?? existing?.author,
      at,
      criterionPatches: body.criterionPatches ?? existing?.criterionPatches,
      fitOverride: body.fitOverride ?? existing?.fitOverride,
      history: existing?.history ?? [],
    });

    const withHistory = appendOverrideHistory(
      record,
      body.action ?? "update",
      body.note ?? record.note,
      body.author
    );

    saveOverride(withHistory);
    const score = loadScore(ref);
    return NextResponse.json({ override: withHistory, score });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Override save failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
