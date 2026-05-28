import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official Google Gemini spark (2025) from /public/gemini-logo.svg.
 * Use `onAccent` on blue AI buttons so the full-color mark sits on a white chip.
 */
export function GeminiIcon({
  className,
  size = 16,
  onAccent = false,
  /** @deprecated Use onAccent — inverting destroys the official gradient colors */
  inverted = false,
}: {
  className?: string;
  size?: number;
  onAccent?: boolean;
  inverted?: boolean;
}) {
  const useChip = onAccent || inverted;

  const icon = (
    <Image
      src="/gemini-logo.svg"
      alt=""
      width={size}
      height={size}
      aria-hidden
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );

  if (!useChip) return icon;

  const pad = Math.max(2, Math.round(size * 0.125));
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-black/5"
      style={{
        width: size + pad * 2,
        height: size + pad * 2,
        padding: pad,
      }}
    >
      {icon}
    </span>
  );
}
