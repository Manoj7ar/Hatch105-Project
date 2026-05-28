import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { ThesisDetailPage } from "@/components/thesis/ThesisDetailPage";
import { ThesisDetailBuilding } from "@/components/thesis/ThesisDetailBuilding";
import { CompareTray } from "@/components/CompareTray";
import {
  baseThesisRefs,
  findThesisByRefAsync,
  getRankingStateAsync,
  loadAllTheses,
  loadResearchAsync,
  loadScoreAsync,
} from "@/lib/data";
import { isThesisProfileComplete } from "@/lib/ensure-thesis-profile";
import type { ResearchResult } from "@/lib/research";
import { rankScores } from "@/lib/rank";
import { thesisStubFromScore } from "@/lib/extra-theses";
import {
  getAdjacentRefs,
  getCohortBenchmarks,
  getRankedThesisByRef,
} from "@/lib/thesis-detail";

type PageProps = { params: Promise<{ ref: string }> };

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  return loadAllTheses().map((t) => ({ ref: t.ref }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ref } = await params;
  const state = await getRankingStateAsync();
  const thesis = getRankedThesisByRef(ref, state.ranked);
  if (!thesis) return { title: "Idea not found · Hatch105" };
  return {
    title: `${thesis.title} · Hatch105`,
    description: thesis.thesis?.one_liner ?? thesis.verdict,
  };
}

export default async function IdeaDetailRoute({ params }: PageProps) {
  const { ref } = await params;
  const state = await getRankingStateAsync();
  let thesis = getRankedThesisByRef(ref, state.ranked);

  if (!thesis) {
    const score = await loadScoreAsync(ref);
    const meta = await findThesisByRefAsync(ref);
    if (!score && !meta) notFound();
    if (score) {
      thesis = rankScores(
        [score],
        [meta ?? thesisStubFromScore(score)]
      )[0]!;
    } else {
      notFound();
    }
  }

  const benchmarks = getCohortBenchmarks(state.ranked);
  const adjacent = getAdjacentRefs(state.ranked, thesis.ref);
  const research = (await loadResearchAsync(ref)) as ResearchResult | null;

  const isBase = baseThesisRefs().has(thesis.ref);
  const needsBuild = !isBase && !isThesisProfileComplete(thesis);

  if (needsBuild) {
    return (
      <div className="min-h-full bg-white">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-6 py-10 pb-28">
          <ThesisDetailBuilding
            refId={thesis.ref}
            thesis={thesis}
            benchmarks={benchmarks}
          />
        </main>
        <CompareTray />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10 pb-28">
        <ThesisDetailPage
          thesis={thesis}
          benchmarks={benchmarks}
          adjacent={adjacent}
          ranked={state.ranked}
          research={research}
        />
      </main>
      <CompareTray />
    </div>
  );
}
