"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProgressItem = {
  ref: string;
  title?: string;
  status: "pending" | "running" | "done" | "failed";
  error?: string;
};

export function GroqScoringProgress({
  items,
  active,
}: {
  items: ProgressItem[];
  active: boolean;
}) {
  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const running = items.find((i) => i.status === "running");
  const total = items.length || 1;
  const pct = Math.round((done / total) * 100);

  return (
    <div
      className={cn(
        "rerank-progress-panel",
        active && "rerank-progress-panel--active"
      )}
      role="region"
      aria-label="Groq scoring progress"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="hatch-label">Groq is scoring your ideas</p>
          <p className="mt-0.5 text-sm text-slate-600">
            {active && running ? (
              <>
                Working on{" "}
                <span className="font-medium text-[var(--groq-orange)]">
                  {running.title ?? running.ref}
                </span>
                …
              </>
            ) : active ? (
              "Preparing next thesis…"
            ) : (
              "Scoring complete"
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-semibold tabular-nums text-[var(--groq-orange)]">
            {pct}%
          </p>
          <p className="text-xs text-slate-500">
            {done}/{total} scored
            {failed > 0 ? ` · ${failed} failed` : ""}
          </p>
        </div>
      </div>

      <div className="rerank-progress-track mt-4">
        <div
          className="rerank-progress-fill"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-4 max-h-64 space-y-1.5 overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.ref}
            className={cn(
              "rerank-progress-row",
              item.status === "running" && "rerank-progress-row--running",
              item.status === "done" && "rerank-progress-row--done",
              item.status === "failed" && "rerank-progress-row--failed"
            )}
          >
            <StatusIcon status={item.status} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {item.title ?? item.ref}
              </p>
              <p className="font-mono text-xs text-slate-400">{item.ref}</p>
              {item.error && (
                <p className="mt-0.5 text-xs text-red-600">{item.error}</p>
              )}
            </div>
            <span className="rerank-status-pill">{statusLabel(item.status)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusIcon({ status }: { status: ProgressItem["status"] }) {
  if (status === "running") {
    return (
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--groq-orange)]" />
    );
  }
  if (status === "done") {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />;
  }
  if (status === "failed") {
    return <XCircle className="h-4 w-4 shrink-0 text-red-500" />;
  }
  return <Circle className="h-4 w-4 shrink-0 text-slate-300" />;
}

function statusLabel(status: ProgressItem["status"]) {
  switch (status) {
    case "running":
      return "Scoring";
    case "done":
      return "Done";
    case "failed":
      return "Failed";
    default:
      return "Queued";
  }
}
