import { cn } from "@/lib/utils";

/** gemini / accent = AI-powered actions; primary = neutral confirm; secondary/ghost = non-AI */
type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "gemini"
  | "groq"
  | "accent"
  | "outline-accent";

const variants: Record<Variant, string> = {
  primary:
    "bg-slate-900 text-white hover:bg-slate-800 shadow-sm disabled:opacity-50",
  secondary:
    "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  gemini:
    "bg-[var(--gemini-accent)] text-white shadow-sm hover:bg-[var(--gemini-accent-hover)] disabled:opacity-50",
  groq:
    "bg-[var(--gemini-accent)] text-white shadow-sm hover:bg-[var(--gemini-accent-hover)] disabled:opacity-50",
  accent:
    "bg-[var(--gemini-accent)] text-white shadow-sm hover:bg-[var(--gemini-accent-hover)] disabled:opacity-50",
  "outline-accent":
    "bg-white text-[var(--gemini-accent)] ring-1 ring-[#c5d9fc] hover:bg-[#eef4ff] disabled:opacity-50",
};

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const resolved: Variant =
    variant === "accent" || variant === "groq" ? "gemini" : variant;
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        variants[resolved],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
