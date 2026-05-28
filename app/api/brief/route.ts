import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getRankingStateAsync } from "@/lib/data";
import { generateRankingMarkdown } from "@/lib/markdown";
import { getGroqModel } from "@/lib/models";
import { CRITERIA_VERSION } from "@/lib/criteria-version";

export async function POST() {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY required for executive brief" },
      { status: 503 }
    );
  }

  try {
    const state = await getRankingStateAsync();
    const datasetMd = generateRankingMarkdown(state);

    const { text } = await generateText({
      model: getGroqModel("brief"),
      temperature: 0.2,
      maxOutputTokens: 2048,
      prompt: `Write a one-page executive memo for Happy Stack Labs leadership about the Hatch105 thesis ranking.

Use ONLY the ranking data below. Do not invent teams or scores.
Include: executive pick rationale, top 3 summary, key traps demoted, and 3 open questions.
Format as clean Markdown with ## headings.
Criteria version: ${CRITERIA_VERSION}

RANKING DATA:
${datasetMd.slice(0, 12000)}`,
    });

    return NextResponse.json({
      markdown: text,
      filename: "Hatch105-Executive-Brief.md",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Brief generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
