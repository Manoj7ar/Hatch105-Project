"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../ui/Button";
import { GroqIcon } from "../ui/GroqIcon";
import {
  GroqScoringProgress,
  type ProgressItem,
} from "../rerank/GroqScoringProgress";
import { previewThesesInput } from "@/lib/thesis-input-client";
import type { RankingState } from "@/lib/types";

export function ScoreHandoffModal({
  initialText = "",
  onClose,
  onScored,
}: {
  initialText?: string;
  onClose: () => void;
  onScored?: (state: RankingState) => void;
}) {
  const [text, setText] = useState(initialText);
  const [scoring, setScoring] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [placements, setPlacements] = useState<
    { ref: string; rank: number; summary: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const pollJob = useCallback(async (id: string) => {
    const res = await fetch(`/api/rerank/batch?jobId=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not load progress");
    setItems((data.job?.items ?? []) as ProgressItem[]);
    if (data.job?.done) {
      setScoring(false);
      setPlacements(data.placements ?? []);
      if (data.state) onScored?.(data.state as RankingState);
      return true;
    }
    return false;
  }, [onScored]);

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
          setError(e instanceof Error ? e.message : "Progress update failed");
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

  const submit = async () => {
    const check = previewThesesInput(text, "auto");
    if (!check.ok) {
      setError(check.errors.join(" "));
      return;
    }
    setScoring(true);
    setError(null);
    setPlacements([]);
    setItems([]);
    try {
      const res = await fetch("/api/rerank/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, format: "auto" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Score failed");
      setJobId(data.jobId);
      setItems(data.job?.items ?? []);
      await pollJob(data.jobId);
    } catch (e) {
      setScoring(false);
      setError(e instanceof Error ? e.message : "Score failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/30"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <p className="hatch-label">Score with Groq</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Score this idea</h2>
        <p className="mt-1 text-sm text-slate-500">
          Paste a thesis JSON object or array (same format as Live re-rank).
        </p>
        <div className="hatch-textarea-shell mt-4">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            rows={8}
            disabled={scoring}
            className="w-full resize-y bg-transparent px-3 py-2 font-mono text-xs text-slate-800 focus:outline-none disabled:opacity-60"
            placeholder='{"ref":"H-51","title":"...","one_liner":"...","example_customer":"...","wedge":"..."}'
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {(scoring || items.length > 0) && (
          <div className="mt-4">
            <GroqScoringProgress items={items} active={scoring} />
          </div>
        )}
        {placements.length > 0 && (
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {placements.map((p) => (
              <li key={p.ref} className="hatch-accent-border rounded-lg pl-3">
                <span className="font-mono font-medium text-[var(--groq-orange)]">
                  {p.ref}
                </span>{" "}
                — rank {p.rank}: {p.summary}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="groq"
            onClick={submit}
            disabled={scoring || !text.trim()}
          >
            <GroqIcon size={16} inverted />
            {scoring ? "Scoring with Groq…" : "Score & re-rank with Groq"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {placements.length > 0 && (
            <Link href="/" className="hatch-link self-center text-sm">
              View rankings
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
