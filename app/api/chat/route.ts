import { streamText, type ModelMessage } from "ai";
import { buildDatasetContext } from "@/lib/dataset-context";
import { buildChatSystemPrompt } from "@/lib/prompts/chat-system";
import { getChatModel } from "@/lib/models";
import { expandTeamMentionsAsync } from "@/lib/teams";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

async function toModelMessages(
  messages: ChatMessage[]
): Promise<ModelMessage[]> {
  const out: ModelMessage[] = [];
  for (const m of messages.filter((msg) => msg.content?.trim())) {
    out.push({
      role: m.role,
      content:
        m.role === "user"
          ? await expandTeamMentionsAsync(m.content)
          : m.content,
    });
  }
  return out;
}

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      { error: "GROQ_API_KEY is not configured. Add it to .env.local." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const messages = (body.messages ?? []) as ChatMessage[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages array required" }, { status: 400 });
    }

    const dataset = await buildDatasetContext();
    const system = buildChatSystemPrompt(dataset);

    const result = streamText({
      model: getChatModel(),
      system,
      messages: await toModelMessages(messages),
      temperature: 0.3,
      maxOutputTokens: 3072,
    });

    return result.toTextStreamResponse();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Chat failed";
    const tooLarge =
      message.includes("Request too large") || message.includes("rate_limit");
    return Response.json(
      {
        error: tooLarge
          ? "Dataset context exceeds Groq token limits for this tier. Try again shortly or upgrade Groq tier."
          : message,
      },
      { status: tooLarge ? 413 : 500 }
    );
  }
}
