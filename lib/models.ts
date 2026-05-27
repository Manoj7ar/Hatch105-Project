import { createGroq } from "@ai-sdk/groq";

/** Supports Groq json_schema structured outputs (see console.groq.com/docs/structured-outputs) */
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

export function getGroqModelId(): string {
  return process.env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL;
}

export function getScoringModel() {
  const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });
  return groq(getGroqModelId());
}
