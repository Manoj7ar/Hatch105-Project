import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "success"
  | "warning"
  | "muted"
  | "new"
  | "gemini"
  | "groq";

const variants: Record<Variant, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  muted: "bg-slate-50 text-slate-500",
  new: "bg-[#eef4ff] text-[var(--gemini-accent)] ring-1 ring-[#c5d9fc]",
  gemini: "bg-[#eef4ff] text-[var(--gemini-accent)] ring-1 ring-[#c5d9fc]",
  groq: "bg-[#eef4ff] text-[var(--gemini-accent)] ring-1 ring-[#c5d9fc]",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  const resolved = variant === "groq" ? "gemini" : variant;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variants[resolved],
        className
      )}
    >
      {children}
    </span>
  );
}
