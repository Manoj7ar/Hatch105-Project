"use client";

import type { RankedThesis } from "@/lib/types";
import { CRITERION_LABELS } from "@/lib/criteria";
import type { CriterionKey } from "@/lib/types";
import { X } from "lucide-react";
import { Badge } from "./ui/Badge";

export function ThesisPanel({
  thesis,
  onClose,
}: {
  thesis: RankedThesis;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${thesis.title}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close panel"
      />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{thesis.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-slate-400">{thesis.ref}</span>
              <Badge variant={thesis.scoredWith === "groq" ? "new" : "muted"}>
                {thesis.scoredWith === "groq" ? "Groq" : "Heuristic"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Rank {thesis.rank} · Score {thesis.fit} · {thesis.verdict}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {thesis.gatesTriggered.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {thesis.gatesTriggered.map((g) => (
                <Badge key={g} variant="warning">
                  {g}
                </Badge>
              ))}
            </div>
          )}

          {thesis.thesis && (
            <div className="mb-6 space-y-3 rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
              <p className="font-medium text-slate-800">{thesis.thesis.one_liner}</p>
              <p className="text-slate-500">{thesis.thesis.example_customer}</p>
              <p>{thesis.thesis.wedge}</p>
            </div>
          )}

          {thesis.technicalSnapshot && (
            <section className="mb-6">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Technical snapshot
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {thesis.technicalSnapshot}
              </p>
            </section>
          )}

          {thesis.v1Plan && (
            <section className="mb-6 rounded-lg border border-slate-100 p-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">
                v1 plan
              </h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-slate-700">3 days</dt>
                  <dd className="mt-0.5 text-slate-600">{thesis.v1Plan.day3}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700">3 weeks</dt>
                  <dd className="mt-0.5 text-slate-600">{thesis.v1Plan.week3}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700">10 weeks</dt>
                  <dd className="mt-0.5 text-slate-600">{thesis.v1Plan.week10}</dd>
                </div>
              </dl>
            </section>
          )}

          {thesis.trapNote && (
            <section className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-medium">Trap note — </span>
              {thesis.trapNote}
            </section>
          )}

          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Scores
          </h3>
          <ul className="mt-3 space-y-5">
            {(Object.keys(CRITERION_LABELS) as CriterionKey[]).map((key) => {
              const c = thesis.criteria[key];
              return (
                <li key={key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-slate-700">{CRITERION_LABELS[key]}</span>
                    <span className="font-mono text-sm font-medium text-slate-900">
                      {c.score}/5
                    </span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-800 transition-all"
                      style={{ width: `${(c.score / 5) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{c.reason}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
