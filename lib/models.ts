import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Default Gemini model for Ask dataset chat (`/api/chat` only).
 * Override via GEMINI_MODEL in .env.local.
 *
 * gemini-2.0-flash is deprecated / unavailable for new users — use 2.5+.
 * @see https://ai.google.dev/gemini-api/docs/deprecations
 * @see https://ai.google.dev/gemini-api/docs/models
 */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** Map friendly env values and retired model IDs to a supported model. */
export const GEMINI_MODEL_ALIASES: Record<string, string> = {
  flash: "gemini-2.5-flash",
  "gemini-flash": "gemini-2.5-flash",
  "2.5-flash": "gemini-2.5-flash",
  "2.0-flash": "gemini-2.5-flash",
  "gemini-2.0-flash": "gemini-2.5-flash",
  "gemini-2.0-flash-001": "gemini-2.5-flash",
  "gemini-2.0-flash-lite": "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite-001": "gemini-2.5-flash-lite",
};

function resolveModelId(raw: string | undefined, fallback: string): string {
  const id = (raw ?? fallback).trim();
  return GEMINI_MODEL_ALIASES[id] ?? id;
}

/** API key for Google Generative AI (Gemini). */
export function getGeminiApiKey(): string | undefined {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (key) return key;
  return undefined;
}

export function hasLlmApiKey(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getGeminiModelId(): string {
  return resolveModelId(process.env.GEMINI_MODEL, DEFAULT_GEMINI_MODEL);
}

export function getGeminiModel() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY is not configured. Add it to .env.local."
    );
  }
  const google = createGoogleGenerativeAI({ apiKey });
  return google(getGeminiModelId());
}

export function getChatModel() {
  return getGeminiModel();
}
