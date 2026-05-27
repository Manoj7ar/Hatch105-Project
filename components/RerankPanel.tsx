"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "./ui/Button";
import { GroqIcon } from "./ui/GroqIcon";
import { GroqScoringProgress, type ProgressItem } from "./rerank/GroqScoringProgress";
import { ThesisFormatGuide } from "./rerank/ThesisFormatGuide";
import {
  previewThesesInput,
  THESIS_JSON_EXAMPLE,
  type InputFormat,
} from "@/lib/thesis-input-client";
import type { RankingState } from "@/lib/types";

type BatchCompleteData = {
  state: RankingState;
  placements: { ref: string; rank: number; summary: string }[];
  markdown: string;
  newRefs: string[];
};

export function RerankPanel({
  value,
  onChange,
  onFile,
  onComplete,
  externalError,
}: {
  value: string;
  onChange: (v: string) => void;
  onFile: (file: File) => void;
  onComplete: (data: BatchCompleteData) => void;
  externalError?: string | null;
}) {
  const [format, setFormat] = useState<InputFormat>("auto");
  const [jobId, setJobId] = useState<string | null>(null);
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [scoring, setScoring] = useState(false);
  const [placements, setPlacements] = useState<
    { ref: string; rank: number; summary: string }[]
  >([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "scoring" | "done">("idle");

  const preview = useMemo(
    () => (value.trim() ? previewThesesInput(value, format) : null),
    [value, format]
  );

  const resolvedFormat =
    preview?.ok === true ? preview.format : format === "csv" ? "csv" : "json";

  const pollJob = useCallback(
    async (id: string): Promise<boolean> => {
      const res = await fetch(`/api/rerank/batch?jobId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load progress");

      const jobItems = (data.job?.items ?? []) as ProgressItem[];
      setItems(jobItems);

      if (data.job?.done && data.state) {
        setScoring(false);
        setPhase("done");
        setPlacements(data.placements ?? []);
        onComplete({
          state: data.state,
          placements: data.placements ?? [],
          markdown: data.markdown ?? "",
          newRefs: data.newRefs ?? jobItems.filter((i) => i.status === "done").map((i) => i.ref),
        });
        return true;
      }
      return false;
    },
    [onComplete]
  );

  useEffect(() => {
    if (!jobId || !scoring) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const done = await pollJob(jobId);
        if (done) cancelled = true;
      } catch (e) {
        if (!cancelled) {
          setScoring(false);
          setLocalError(e instanceof Error ? e.message : "Progress update failed");
        }
      }
    };

    void tick();
    const interval = setInterval(() => {
      if (!cancelled) void tick();
    }, 400);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId, scoring, pollJob]);

  const startScoring = async (resumeFailed = false) => {
    setLocalError(null);
    setPlacements([]);

    if (!resumeFailed) {
      if (!value.trim()) {
        setLocalError("Add thesis data before scoring.");
        return;
      }
      const check = previewThesesInput(value, format);
      if (!check.ok) {
        setLocalError(check.errors.join(" "));
        return;
      }
    }

    setScoring(true);
    setPhase("scoring");
    if (!resumeFailed) setItems([]);

    try {
      const res = await fetch("/api/rerank/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: resumeFailed ? undefined : value,
          format,
          resumeFailed,
          jobId: resumeFailed ? jobId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start scoring");

      setJobId(data.jobId);
      setItems(data.job?.items ?? []);
      await pollJob(data.jobId);
    } catch (e) {
      setScoring(false);
      setPhase("idle");
      setLocalError(e instanceof Error ? e.message : "Scoring failed to start");
    }
  };

  const displayError =
    externalError ?? localError ?? (preview && !preview.ok ? preview.errors.join(" ") : null);

  const canSubmit = preview?.ok === true && !scoring;

  return (
    <div className="space-y-6">
      <div className="rerank-shell">
        <header className="rerank-shell-header">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="hatch-label">Live re-rank</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                Add theses · score with Groq · update rankings
              </h3>
              <p className="mt-1 max-w-xl text-sm text-slate-600">
                Paste JSON or CSV, upload a file, or insert the example. Groq scores each
                idea against the Hatch rubric while you watch progress in real time.
              </p>
            </div>
            <div className="rerank-format-toggle flex gap-1 rounded-lg bg-slate-100 p-1">
              {(["json", "csv"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  data-active={resolvedFormat === f ? "true" : "false"}
                  onClick={() => setFormat(f)}
                  disabled={scoring}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div
              className={`rerank-input-shell ${
                preview?.ok ? "rerank-input-shell--valid" : ""
              } ${displayError && value.trim() ? "rerank-input-shell--error" : ""}`}
            >
              <textarea
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  setLocalError(null);
                  setPhase("idle");
                }}
                rows={12}
                disabled={scoring}
                placeholder="Paste JSON array or CSV rows here…"
                className="w-full resize-y bg-transparent px-4 py-3 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
                spellCheck={false}
              />
            </div>

            {preview?.ok && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="hatch-chip">
                  {preview.theses.length} thesis
                  {preview.theses.length === 1 ? "" : "es"} ready
                </span>
                {preview.theses.slice(0, 5).map((t) => (
                  <span
                    key={t.ref}
                    className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600"
                  >
                    {t.ref}
                  </span>
                ))}
                {preview.theses.length > 5 && (
                  <span className="text-xs text-slate-400">
                    +{preview.theses.length - 5} more
                  </span>
                )}
              </div>
            )}

            {displayError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {displayError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                  <Upload className="h-4 w-4" />
                  Upload JSON / CSV
                </span>
                <input
                  type="file"
                  accept=".json,.csv,application/json,text/csv"
                  className="hidden"
                  disabled={scoring}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      onFile(f);
                      setFormat(f.name.toLowerCase().endsWith(".csv") ? "csv" : "json");
                    }
                  }}
                />
              </label>
              <Button
                variant="groq"
                disabled={!canSubmit}
                onClick={() => startScoring(false)}
                className="min-w-[200px]"
              >
                <GroqIcon size={16} inverted />
                {scoring ? "Scoring with Groq…" : "Score & re-rank with Groq"}
              </Button>
              {items.some((i) => i.status === "failed") && !scoring && (
                <Button variant="secondary" onClick={() => startScoring(true)}>
                  Retry failed
                </Button>
              )}
            </div>

            {(scoring || items.length > 0) && (
              <GroqScoringProgress items={items} active={scoring} />
            )}
          </div>

          <ThesisFormatGuide
            format={resolvedFormat}
            onInsertExample={() => onChange(THESIS_JSON_EXAMPLE)}
          />
        </div>
      </div>

      {phase === "done" && placements.length > 0 && (
        <div className="rerank-shell p-6">
          <h3 className="text-sm font-semibold text-slate-900">Placement summary</h3>
          <p className="mt-1 text-xs text-slate-500">
            New ideas merged into the full ranking — open All ideas to explore.
          </p>
          <ul className="mt-4 space-y-3">
            {placements.map((p) => (
              <li
                key={p.ref}
                className="rerank-placement-card rounded-lg px-4 py-3 text-sm leading-relaxed text-slate-600"
              >
                <span className="font-mono font-semibold text-[var(--groq-orange)]">
                  {p.ref}
                </span>
                <span className="text-slate-400"> · rank {p.rank}</span>
                <p className="mt-1">{p.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
