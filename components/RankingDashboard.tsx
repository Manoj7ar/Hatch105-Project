"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RankedThesis, RankingState } from "@/lib/types";
import { ideaPath } from "@/lib/idea-path";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ExecutiveCard } from "./ExecutiveCard";
import { TopThreeCards } from "./TopThreeCards";
import { RankingTable } from "./RankingTable";
import { RerankPanel } from "./RerankPanel";
import { Button } from "./ui/Button";
import { FocusInput } from "./ui/FocusInput";
import { GroqIcon } from "./ui/GroqIcon";
import { CompareTray } from "./CompareTray";
import { PortfolioBoard } from "./PortfolioBoard";
import { TrapStories } from "./traps/TrapStories";
import { TensionTable } from "./traps/TensionTable";
import { groupTrapStories, listCohortTensions } from "@/lib/thesis-insights";

type Tab = "all" | "top3" | "traps" | "rerank" | "portfolio";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All ideas" },
  { id: "top3", label: "Top 3" },
  { id: "traps", label: "Traps" },
  { id: "rerank", label: "Live re-rank" },
  { id: "portfolio", label: "Portfolio" },
];

export function RankingDashboard() {
  const router = useRouter();
  const [state, setState] = useState<RankingState | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [rerankInput, setRerankInput] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
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

  const filteredRows = useCallback(
    (rows: RankedThesis[]) => {
      const q = search.trim().toLowerCase();
      if (!q) return rows;
      return rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ref.toLowerCase().includes(q)
      );
    },
    [search]
  );

  const listRaw =
    tab === "top3"
      ? state?.top3 ?? []
      : tab === "traps"
        ? state?.traps ?? []
        : state?.ranked ?? [];

  const list = filteredRows(listRaw);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === "Escape") {
        setShowShortcuts(false);
        return;
      }

      if (e.key === "?" && !typing) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
        return;
      }

      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (tab !== "all" && tab !== "traps" && tab !== "top3") return;
      if (typing || list.length === 0) return;

      if (e.key === "j") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, list.length - 1));
      }
      if (e.key === "k") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const row = list[highlightIndex];
        if (row) router.push(ideaPath(row.ref));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, list, highlightIndex, router]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [search, tab]);

  const onRerankComplete = (data: {
    state: RankingState;
    placements: { ref: string; rank: number; summary: string }[];
    markdown: string;
    newRefs: string[];
  }) => {
    setError(null);
    setState(data.state);
    setMarkdown(data.markdown);
    setPlacements(data.placements);
    setNewRefs(new Set(data.newRefs ?? []));
    setTab("all");
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

  const downloadBrief = async () => {
    setBriefLoading(true);
    try {
      const res = await fetch("/api/brief", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Brief failed");
      const blob = new Blob([data.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename ?? "Hatch105-Executive-Brief.md";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Brief failed");
    } finally {
      setBriefLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="hatch-spinner h-6 w-6 animate-spin" />
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

  return (
    <div className="space-y-8 pb-24">
      <ExecutiveCard state={state} onExportRanking={downloadMd} />

      <div className="space-y-3">
        <nav className="hatch-tablist" role="tablist">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "hatch-tab hatch-tab--segment",
                tab === id && "hatch-tab--active",
                id === "rerank" && tab === id && "hatch-tab--ai"
              )}
            >
              {label}
              {id === "all" && (
                <span className="ml-1 tabular-nums text-slate-400">{state.ranked.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex flex-nowrap items-center justify-end gap-2">
          <FocusInput
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams… (/)"
            className="min-w-0 flex-1 sm:max-w-xs"
          />
          <Button
            variant="groq"
            onClick={downloadBrief}
            disabled={briefLoading}
            className="shrink-0"
          >
            <GroqIcon size={16} inverted />
            {briefLoading ? "Memo…" : "Executive brief"}
          </Button>
        </div>
      </div>

      {showShortcuts && (
        <p className="rounded-lg bg-slate-50 px-4 py-2 text-xs text-slate-600">
          <kbd className="font-mono">/</kbd> search · <kbd className="font-mono">j</kbd>/<kbd className="font-mono">k</kbd> navigate · <kbd className="font-mono">Enter</kbd> open · <kbd className="font-mono">?</kbd> help
        </p>
      )}

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
          onComplete={onRerankComplete}
          externalError={tab === "rerank" ? error : null}
        />
      ) : tab === "portfolio" ? (
        <PortfolioBoard ranked={state.ranked} />
      ) : tab === "top3" ? (
        <TopThreeCards items={state.top3} />
      ) : tab === "traps" && state ? (
        <div className="space-y-10">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Trap stories</h2>
              <p className="mt-1 text-sm text-slate-500">
                Narrative buckets for ideas that look like winners but fail a 3-person Hatch
                sprint — grounded in gates and rubric, not vibes.
              </p>
            </div>
            <TrapStories stories={groupTrapStories(state.ranked)} />
          </div>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Rank vs gates</h2>
              <p className="mt-1 text-sm text-slate-500">
                High fit or top-15 placement despite hard gates — read before trusting the headline
                rank.
              </p>
            </div>
            <TensionTable tensions={listCohortTensions(state.ranked)} />
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">All flagged ideas</h2>
            <RankingTable
              rows={list}
              newRefs={newRefs}
              highlightRef={list[highlightIndex]?.ref}
            />
          </div>
        </div>
      ) : (
        <RankingTable
          rows={list}
          newRefs={newRefs}
          highlightRef={list[highlightIndex]?.ref}
        />
      )}

      <CompareTray />
    </div>
  );
}
