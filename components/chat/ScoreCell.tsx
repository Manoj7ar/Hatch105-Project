import { cn } from "@/lib/utils";

export function parseScoreValue(raw: string): number | null {
  const t = raw.trim();
  const slash = t.match(/^(\d(?:\.\d+)?)\s*\/\s*5$/);
  if (slash) return Math.min(5, Math.max(0, parseFloat(slash[1])));
  if (/^\d(?:\.\d+)?$/.test(t)) {
    const n = parseFloat(t);
    if (n <= 5) return n;
    if (n <= 10) return n / 2;
  }
  return null;
}

function barColor(score: number): string {
  if (score >= 4) return "bg-emerald-500";
  if (score >= 3) return "bg-amber-400";
  return "bg-orange-400";
}

export function ScoreCell({ children }: { children: string }) {
  const text = String(children).trim();
  const score = parseScoreValue(text);

  if (score === null) {
    return <>{text}</>;
  }

  const pct = (score / 5) * 100;

  return (
    <div className="flex min-w-[4.5rem] items-center gap-2">
      <span className="w-6 shrink-0 font-mono text-xs tabular-nums text-slate-700">
        {text}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all", barColor(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
