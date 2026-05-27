import Image from "next/image";
import { cn } from "@/lib/utils";

/** Groq mark from /public/groq-logo.ico — use `inverted` on orange backgrounds. */
export function GroqIcon({
  className,
  size = 16,
  inverted = false,
}: {
  className?: string;
  size?: number;
  /** White mark for Groq-orange buttons and progress UI */
  inverted?: boolean;
}) {
  return (
    <Image
      src="/groq-logo.ico"
      alt=""
      width={size}
      height={size}
      aria-hidden
      className={cn(
        "shrink-0 object-contain",
        inverted && "brightness-0 invert",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
