"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useCompare } from "@/lib/compare-store";
import type { RankedThesis } from "@/lib/types";
import { CRITERION_KEYS, type CriterionKey } from "@/lib/types";
import { CRITERION_LABELS } from "@/lib/criteria";
import { EvidenceChip } from "@/components/EvidenceChip";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ideaPath } from "@/lib/idea-path";

export default function ComparePage() {
  const { refs } = useCompare();
  const [rows, setRows] = useState<RankedThesis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/ranking");
        const data = await res.json();
        const ranked = (data.state?.ranked ?? []) as RankedThesis[];
        setRows(ranked.filter((r: RankedThesis) => refs.includes(r.ref)));
      } finally {
        setLoading(false);
      }
    })();
  }, [refs]);

  return (
    <div className="min-h-full bg-white">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="hatch-label mb-1">Compare</p>
            <h1 className="text-2xl font-semibold text-slate-900">Compare teams</h1>
          </div>
          <Link href="/" className="hatch-link text-sm">
            ← Rankings
          </Link>
        </div>

        {refs.length === 0 ? (
          <p className="text-sm text-slate-500">
            Add up to 4 teams from the rankings table or chat.
          </p>
        ) : loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="hatch-spinner h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:overflow-x-auto">
            {rows.map((row) => (
              <article
                key={row.ref}
                className="min-w-0 flex-1 rounded-xl border border-t-2 border-t-[var(--groq-orange)] border-slate-200 bg-white p-4 shadow-sm lg:min-w-[240px]"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  <Link href={ideaPath(row.ref)} className="hover:text-[var(--groq-orange)]">
                    {row.title}
                  </Link>
                </h2>
                <p className="font-mono text-xs text-slate-400">
                  {row.ref} · fit {row.fit}
                </p>
                <p className="mt-2 text-sm text-slate-600">{row.verdict}</p>
                <ul className="mt-4 space-y-3">
                  {CRITERION_KEYS.map((key: CriterionKey) => {
                    const c = row.criteria[key];
                    return (
                      <li key={key}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-slate-600">{CRITERION_LABELS[key]}</span>
                          <span className="flex items-center gap-1">
                            <EvidenceChip tag={c.evidence ?? "inferred"} />
                            <span className="font-mono font-semibold">{c.score}</span>
                          </span>
                        </div>
                        <div className="mt-1 h-1 rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-800"
                            style={{ width: `${(c.score / 5) * 100}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {row.surfaceFlags && row.surfaceFlags.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-amber-800">
                    {row.surfaceFlags.map((f) => (
                      <li key={f.code}>{f.message}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
