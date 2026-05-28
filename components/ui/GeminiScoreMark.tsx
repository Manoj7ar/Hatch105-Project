import Image from "next/image";
import { cn } from "@/lib/utils";

const TOOLTIP: Record<string, string> = {
  groq: "AI-scored with Groq (legacy)",
  gemini: "AI-scored with Google Gemini",
  "human+groq": "Human override on Groq score (legacy)",
  "human+gemini": "Human override on Gemini score",
};

export function isLlmScoredWith(scoredWith: string): boolean {
  return (
    scoredWith === "groq" ||
    scoredWith === "gemini" ||
    scoredWith === "human+groq" ||
    scoredWith === "human+gemini"
  );
}

/** Inline 1:1 Gemini spark for ranking rows and headers (replaces Groq/Gemini text badges). */
export function GeminiScoreMark({
  scoredWith,
  size = 14,
  className,
}: {
  scoredWith: string;
  size?: number;
  className?: string;
}) {
  if (!isLlmScoredWith(scoredWith)) return null;

  const title = TOOLTIP[scoredWith] ?? "AI-scored";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md bg-white p-0.5 shadow-sm ring-1 ring-[#c5d9fc]",
        className
      )}
      title={title}
    >
      <Image
        src="/gemini-logo.svg"
        alt={title}
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
