import { createGroq } from "@ai-sdk/groq";

/**
 * Default Groq model for all app tasks (chat, executive brief, thesis scoring).
 * `llama-3.3-70b-versatile` — strong general chat/reasoning; json_object / generateObject
 * with JSON fallback in lib/scorer.ts.
 *
 * Override via GROQ_MODEL in .env.local. For stricter schema-only scoring you can set
 * GROQ_SCORING_MODEL=openai/gpt-oss-20b (or openai/gpt-oss-120b) without changing chat.
 *
 * @see https://console.groq.com/docs/models
 */
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

export const GROQ_MODEL_ALIASES: Record<string, string> = {
  "llama-3.3-70b": "llama-3.3-70b-versatile",
  "gpt-oss-20b": "openai/gpt-oss-20b",
  "gpt-oss-120b": "openai/gpt-oss-120b",
};

function resolveModelId(raw: string | undefined, fallback: string): string {
  const id = (raw ?? fallback).trim();
  return GROQ_MODEL_ALIASES[id] ?? id;
}

export function getGroqModelId(
  purpose: "chat" | "scoring" | "brief" = "chat"
): string {
  if (purpose === "scoring" && process.env.GROQ_SCORING_MODEL?.trim()) {
    return resolveModelId(
      process.env.GROQ_SCORING_MODEL,
      DEFAULT_GROQ_MODEL
    );
  }
  return resolveModelId(process.env.GROQ_MODEL, DEFAULT_GROQ_MODEL);
}

function createModel(modelId: string) {
  const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });
  return groq(modelId);
}

/** Shared Groq model — used for chat, brief, and scoring unless GROQ_SCORING_MODEL is set. */
export function getGroqModel(purpose: "chat" | "scoring" | "brief" = "chat") {
  return createModel(getGroqModelId(purpose));
}

/** @deprecated Use getGroqModel — kept for existing imports */
export function getScoringModel() {
  return getGroqModel("scoring");
}

export function getChatModel() {
  return getGroqModel("chat");
}
