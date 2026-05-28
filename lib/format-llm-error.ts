import { RetryError } from "ai";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "AI request failed";
}

/** Unwrap AI SDK RetryError and nested causes to the underlying API message. */
function unwrapLlmError(error: unknown): unknown {
  if (RetryError.isInstance(error)) {
    return error.lastError ?? error.errors?.[error.errors.length - 1] ?? error;
  }

  if (error instanceof Error && error.cause) {
    return unwrapLlmError(error.cause);
  }

  const withLastError = error as { lastError?: unknown; errors?: unknown[] };
  if (withLastError.lastError) return unwrapLlmError(withLastError.lastError);
  if (withLastError.errors?.length) {
    return unwrapLlmError(
      withLastError.errors[withLastError.errors.length - 1]
    );
  }

  return error;
}

/** User-facing message for Gemini / AI SDK failures in chat and API routes. */
export function formatLlmError(error: unknown): string {
  const root = unwrapLlmError(error);
  const message = extractErrorMessage(root);
  const lower = message.toLowerCase();

  if (
    lower.includes("prepayment credits are depleted") ||
    lower.includes("resource_exhausted") ||
    (lower.includes("429") && lower.includes("credit"))
  ) {
    return "Gemini API credits are depleted. Add billing or top up your project at Google AI Studio (https://aistudio.google.com/), then try again.";
  }

  if (lower.includes("api key not valid") || lower.includes("invalid api key")) {
    return "Invalid GOOGLE_GENERATIVE_AI_API_KEY. Create a new key at https://aistudio.google.com/apikey and update .env.local / Vercel env.";
  }

  if (
    lower.includes("rate_limit") ||
    lower.includes("quota") ||
    lower.includes("too many requests")
  ) {
    return "Gemini rate limit or quota exceeded. Wait a minute and try again, or check your quota in Google AI Studio.";
  }

  if (
    lower.includes("no output generated") ||
    lower.includes("empty response")
  ) {
    const nested = unwrapLlmError(error);
    const nestedMsg = extractErrorMessage(nested).toLowerCase();
    if (nestedMsg !== lower) {
      return formatLlmError(nested);
    }
    return "Gemini returned no response. Check your API key, billing, and quota in Google AI Studio.";
  }

  if (lower.includes("request too large") || lower.includes("token")) {
    return "The ranking context is too large for this Gemini tier. Try a shorter question or upgrade your quota.";
  }

  return message;
}
