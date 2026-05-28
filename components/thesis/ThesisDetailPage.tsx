import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { RankedThesis } from "@/lib/types";
import { CRITERION_LABELS } from "@/lib/criteria";
import { CRITERION_KEYS } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { EvidenceChip } from "@/components/EvidenceChip";
import { CriterionRadarChart } from "./CriterionRadarChart";
import { CriterionCompareBars } from "./CriterionCompareBars";
import { FitCohortChart } from "./FitCohortChart";
import { ThesisDetailActions } from "./ThesisDetailActions";
import { ThesisDetailBody } from "./ThesisDetailBody";
import type { CohortBenchmarks } from "@/lib/thesis-detail";
import type { ResearchResult } from "@/lib/research";
import { getFitPercentile, ideaPath } from "@/lib/thesis-detail";
import {
  getWhyThisRank,
  getSimilarTheses,
  getRankGateTension,
} from "@/lib/thesis-insights";

function verdictVariant(
  verdict: string
): "success" | "warning" | "muted" | "default" {
  if (verdict.includes("Strong")) return "success";
  if (verdict.includes("Viable")) return "default";
  if (verdict.includes("Borderline")) return "warning";
  return "muted";
}

export function ThesisDetailPage({
  thesis,
  benchmarks,
  adjacent,
  ranked,
  research = null,
}: {
  thesis: RankedThesis;
  benchmarks: CohortBenchmarks;
  adjacent: { prev: RankedThesis | null; next: RankedThesis | null };
  ranked: RankedThesis[];
  research?: ResearchResult | null;
}) {
  const why = getWhyThisRank(thesis, benchmarks, ranked);
  const similar = getSimilarTheses(thesis, ranked);
  const tension = getRankGateTension(thesis);
  const scoredLabel =
    thesis.scoredWith === "human+groq"
      ? "Human + Groq"
      : thesis.scoredWith === "groq"
        ? "Groq"
        : "Heuristic";

  const percentile = getFitPercentile(thesis.rank, benchmarks.count);
  const vsMedian =
    Math.round((thesis.fit - benchmarks.medianFit) * 100) / 100;

  return (
    <article className="thesis-detail space-y-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        All rankings
      </Link>

      <header className="space-y-4">
        <p className="hatch-label">Company profile</p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {thesis.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-slate-400">{thesis.ref}</span>
              <span className="hatch-chip">Rank #{thesis.rank}</span>
              <Badge variant="muted">{scoredLabel}</Badge>
              <Badge variant={verdictVariant(thesis.verdict)}>{thesis.verdict}</Badge>
              {thesis.overrideNote && (
                <Badge variant="warning" className="text-[10px]">
                  Override
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Hatch Fit
            </p>
            <p className="font-mono text-4xl font-semibold tabular-nums text-slate-900">
              {thesis.fit}
            </p>
          </div>
        </div>
      </header>

      <ThesisDetailBody
        why={why}
        similar={similar}
        tension={tension}
        thesis={thesis}
        benchmarks={benchmarks}
        rankContextGrid={
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="hatch-label">Rank context</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                #{thesis.rank}
                <span className="text-base font-normal text-slate-500">
                  {" "}
                  of {benchmarks.count}
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Top {percentile}% of cohort by fit score
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="hatch-label">vs cohort</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {vsMedian >= 0 ? "+" : ""}
                {vsMedian}
                <span className="text-base font-normal text-slate-500"> vs median</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Cohort median {benchmarks.medianFit} · mean {benchmarks.meanFit}
              </p>
              {benchmarks.topPick.ref !== thesis.ref && (
                <p className="mt-2 text-xs text-slate-500">
                  #1:{" "}
                  <Link href={ideaPath(benchmarks.topPick.ref)} className="hatch-link">
                    {benchmarks.topPick.title}
                  </Link>{" "}
                  (fit {benchmarks.topPick.fit})
                </p>
              )}
            </div>
          </div>
        }
        actions={
          <ThesisDetailActions
            thesis={thesis}
            topPickRef={benchmarks.topPick.ref}
            research={research}
          />
        }
        charts={
          <section className="grid gap-4 lg:grid-cols-3">
            <CriterionRadarChart thesis={thesis} benchmarks={benchmarks} />
            <CriterionCompareBars thesis={thesis} benchmarks={benchmarks} />
            <FitCohortChart thesis={thesis} benchmarks={benchmarks} />
          </section>
        }
        belowCharts={
          <div className="space-y-6">
      {thesis.thesis && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="hatch-label">Thesis</h2>
          <p className="mt-3 text-lg font-medium leading-relaxed text-slate-900">
            {thesis.thesis.one_liner}
          </p>
          <p className="mt-2 text-sm text-slate-500">{thesis.thesis.example_customer}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{thesis.thesis.wedge}</p>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="hatch-label">Criterion scores</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2">
          {CRITERION_KEYS.map((key) => {
            const c = thesis.criteria[key];
            const cohort = benchmarks.criterionAverages[key];
            return (
              <li
                key={key}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    {CRITERION_LABELS[key]}
                    <EvidenceChip tag={c.evidence ?? "inferred"} />
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900">
                    {c.score}/5
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-600"
                    style={{ width: `${(c.score / 5) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  Cohort avg {cohort}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.reason}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {(thesis.technicalSnapshot ||
        thesis.v1Plan ||
        thesis.trapNote ||
        (thesis.surfaceFlags && thesis.surfaceFlags.length > 0) ||
        thesis.gatesTriggered.length > 0) && (
        <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="hatch-label">Deep dive</h2>

          {thesis.gatesTriggered.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {thesis.gatesTriggered.map((g) => (
                <Badge key={g} variant="warning">
                  {g}
                </Badge>
              ))}
            </div>
          )}

          {thesis.surfaceFlags && thesis.surfaceFlags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Shopify surface flags
              </h3>
              {thesis.surfaceFlags.map((f) => (
                <p
                  key={f.code}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    f.severity === "error"
                      ? "bg-red-50 text-red-800"
                      : f.severity === "warning"
                        ? "bg-amber-50 text-amber-900"
                        : "bg-slate-50 text-slate-600"
                  }`}
                >
                  {f.message}
                </p>
              ))}
            </div>
          )}

          {thesis.technicalSnapshot && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Technical snapshot
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {thesis.technicalSnapshot}
              </p>
            </div>
          )}

          {thesis.v1Plan && (
            <div className="grid gap-4 sm:grid-cols-3">
              {(
                [
                  ["3 days", thesis.v1Plan.day3],
                  ["3 weeks", thesis.v1Plan.week3],
                  ["10 weeks", thesis.v1Plan.week10],
                ] as const
              ).map(([label, body]) => (
                <div
                  key={label}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <dt className="text-xs font-semibold uppercase text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-slate-600">{body}</dd>
                </div>
              ))}
            </div>
          )}

          {thesis.trapNote && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-medium">Trap note — </span>
              {thesis.trapNote}
            </div>
          )}
        </section>
      )}

      <nav
        className="flex items-center justify-between gap-4 border-t border-slate-200 pt-8"
        aria-label="Adjacent rankings"
      >
        {adjacent.prev ? (
          <Link
            href={ideaPath(adjacent.prev.ref)}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="max-w-[12rem] truncate">{adjacent.prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {adjacent.next ? (
          <Link
            href={ideaPath(adjacent.next.ref)}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <span className="max-w-[12rem] truncate">{adjacent.next.title}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
          </div>
        }
      />
    </article>
  );
}
