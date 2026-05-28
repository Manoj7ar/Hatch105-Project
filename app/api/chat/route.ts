import { streamText, type ModelMessage } from "ai";
import { createTextStreamResponse } from "ai";
import { buildDatasetContext } from "@/lib/dataset-context";
import { formatLlmError } from "@/lib/format-llm-error";
import { buildChatSystemPrompt } from "@/lib/prompts/chat-system";
import { getChatModel, hasLlmApiKey } from "@/lib/models";
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

/**
 * Wait for the first token (or failure) so billing/quota errors return JSON
 * instead of HTTP 200 with an empty stream.
 */
async function createValidatedTextStream(
  result: ReturnType<typeof streamText>,
  getCapturedError?: () => unknown
): Promise<ReadableStream<string>> {
  const iterator = result.textStream[Symbol.asyncIterator]();
  let first: IteratorResult<string>;

  try {
    first = await iterator.next();
  } catch (err) {
    throw err;
  }

  if (first.done || !first.value?.length) {
    const captured = getCapturedError?.();
    if (captured) throw captured;

    try {
      await result.text;
    } catch (err) {
      throw err;
    }
    throw new Error("Gemini returned an empty response.");
  }

  return new ReadableStream<string>({
    async start(controller) {
      try {
        controller.enqueue(first.value!);
        while (true) {
          const next = await iterator.next();
          if (next.done) break;
          if (next.value) controller.enqueue(next.value);
        }
        controller.close();
      } catch (err) {
        controller.error(err instanceof Error ? err : new Error(String(err)));
      }
    },
  });
}

export async function POST(req: Request) {
  if (!hasLlmApiKey()) {
    return Response.json(
      {
        error:
          "GOOGLE_GENERATIVE_AI_API_KEY is not configured. Add it to .env.local or Vercel project env.",
      },
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

    let capturedError: unknown;
    const result = streamText({
      model: getChatModel(),
      system,
      messages: await toModelMessages(messages),
      temperature: 0.3,
      maxOutputTokens: 3072,
      maxRetries: 0,
      onError: ({ error }) => {
        capturedError = error;
      },
    });

    const textStream = await createValidatedTextStream(
      result,
      () => capturedError
    );
    return createTextStreamResponse({ textStream });
  } catch (e) {
    const message = formatLlmError(e);
    const status = message.includes("not configured")
      ? 503
      : message.includes("too large") || message.includes("token")
        ? 413
        : 502;
    console.error("[chat] Gemini error:", e);
    return Response.json({ error: message }, { status });
  }
}
