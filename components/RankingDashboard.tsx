"use client";

import { useCallback, useEffect, useState } from "react";
import type { RankedThesis, RankingState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Download, Loader2 } from "lucide-react";
import { ExecutiveCard } from "./ExecutiveCard";
import { TopThreeCards } from "./TopThreeCards";
import { RankingTable } from "./RankingTable";
import { ThesisPanel } from "./ThesisPanel";
import { RerankPanel } from "./RerankPanel";
import { Button } from "./ui/Button";

type Tab = "all" | "top3" | "traps" | "rerank";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All ideas" },
  { id: "top3", label: "Top 3" },
  { id: "traps", label: "Traps" },
  { id: "rerank", label: "Live re-rank" },
];

export function RankingDashboard() {
  const [state, setState] = useState<RankingState | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<RankedThesis | null>(null);
  const [loading, setLoading] = useState(true);
  const [rerankInput, setRerankInput] = useState("");
  const [reranking, setReranking] = useState(false);
  const [placements, setPlacements] = useState<
    { ref: string; rank: number; summary: string }[]
  >([]);
  const [newRefs, setNewRefs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ranking");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setState(data.state);
      setMarkdown(data.markdown ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleRerank = async () => {
    if (!rerankInput.trim()) return;
    setReranking(true);
    setError(null);
    try {
      const res = await fetch("/api/rerank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rerankInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Re-rank failed");
      setState(data.state);
      setMarkdown(data.markdown ?? "");
      setPlacements(data.placements ?? []);
      setNewRefs(new Set(data.newRefs ?? []));
      setTab("all");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Re-rank failed");
    } finally {
      setReranking(false);
    }
  };

  const downloadMd = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "RANKING.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <p className="text-sm">Loading rankings…</p>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm font-medium text-red-800">{error}</p>
        <p className="mt-2 text-sm text-red-600/80">
          Run <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs">npm run seed</code> first.
        </p>
        <Button variant="primary" className="mt-4" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  if (!state) return null;

  const list =
    tab === "top3"
      ? state.top3
      : tab === "traps"
        ? state.traps
        : state.ranked;

  return (
    <div className="space-y-8">
      <ExecutiveCard state={state} />

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav
          className="inline-flex rounded-lg bg-slate-100/80 p-1"
          role="tablist"
        >
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                tab === id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {label}
              {id === "all" && (
                <span className="ml-1.5 text-slate-400">{state.ranked.length}</span>
              )}
            </button>
          ))}
        </nav>

        <Button variant="secondary" onClick={downloadMd} className="shrink-0">
          <Download className="h-4 w-4" />
          Export markdown
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {tab === "rerank" ? (
        <RerankPanel
          value={rerankInput}
          onChange={setRerankInput}
          onFile={async (f) => setRerankInput(await f.text())}
          onSubmit={handleRerank}
          loading={reranking}
          placements={placements}
        />
      ) : tab === "top3" ? (
        <TopThreeCards items={state.top3} />
      ) : (
        <>
          {tab === "traps" && (
            <p className="text-sm text-slate-500">
              Ideas flagged by low fit, hard gates, or known trap patterns.
            </p>
          )}
          <RankingTable
            rows={list}
            newRefs={newRefs}
            onSelect={setSelected}
          />
        </>
      )}

      {selected && (
        <ThesisPanel thesis={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
