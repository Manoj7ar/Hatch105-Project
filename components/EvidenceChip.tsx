import type { EvidenceTag } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABELS: Record<EvidenceTag, string> = {
  sourced: "S",
  inferred: "I",
  guess: "G",
};

const TITLES: Record<EvidenceTag, string> = {
  sourced: "Sourced from thesis or research",
  inferred: "Inferred from context",
  guess: "Guess — low confidence",
};

export function EvidenceChip({ tag }: { tag: EvidenceTag }) {
  return (
    <span
      title={TITLES[tag]}
      className={cn(
        "inline-flex h-4 min-w-[1rem] items-center justify-center rounded px-1 font-mono text-[10px] font-semibold",
        tag === "sourced" && "bg-emerald-100 text-emerald-800",
        tag === "inferred" && "bg-slate-100 text-slate-600",
        tag === "guess" && "bg-amber-100 text-amber-800"
      )}
    >
      {LABELS[tag]}
    </span>
  );
}
