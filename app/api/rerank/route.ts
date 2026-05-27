import { NextRequest, NextResponse } from "next/server";
import { parseThesesInput } from "@/lib/parse";
import { scoreThesis } from "@/lib/scorer";
import {
  loadCandidateTheses,
  loadAllScores,
  saveScore,
} from "@/lib/data";
import { rankScores, placementSummary } from "@/lib/rank";
import { buildRankingState, generateRankingMarkdown } from "@/lib/markdown";
import { writeFileSync } from "fs";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let raw: string;
    let format: "json" | "csv" | "auto" = "auto";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (file instanceof File) {
        raw = await file.text();
        const name = file.name.toLowerCase();
        format = name.endsWith(".csv") ? "csv" : "json";
      } else {
        raw = String(form.get("text") ?? "");
      }
    } else {
      const body = await req.json();
      raw = body.text ?? body.raw ?? "";
      format = body.format ?? "auto";
    }

    if (!raw?.trim()) {
      return NextResponse.json({ error: "No thesis data provided" }, { status: 400 });
    }

    const newTheses = parseThesesInput(raw, format);
    const scored: Awaited<ReturnType<typeof scoreThesis>>[] = [];

    for (const t of newTheses) {
      const s = await scoreThesis(t);
      saveScore(s);
      scored.push(s);
    }

    const base = loadCandidateTheses();
    const allTheses = [
      ...base,
      ...newTheses.filter((n) => !base.some((b) => b.ref === n.ref)),
    ];
    const scores = loadAllScores().filter((s) =>
      allTheses.some((t) => t.ref === s.ref)
    );
    const ranked = rankScores(scores, allTheses);
    const placements = placementSummary(
      ranked,
      newTheses.map((t) => t.ref)
    );
    const state = buildRankingState(ranked);
    const markdown = generateRankingMarkdown(state);

    try {
      writeFileSync(join(process.cwd(), "RANKING.md"), markdown);
    } catch {
      /* read-only fs on some hosts */
    }

    return NextResponse.json({
      state,
      placements,
      newRefs: newTheses.map((t) => t.ref),
      markdown,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Re-rank failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
