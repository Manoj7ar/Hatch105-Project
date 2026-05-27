import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { ThesisDetailPage } from "@/components/thesis/ThesisDetailPage";
import { CompareTray } from "@/components/CompareTray";
import { loadCandidateTheses } from "@/lib/data";
import { getRankingState } from "@/lib/data";
import {
  getAdjacentRefs,
  getCohortBenchmarks,
  getRankedThesisByRef,
} from "@/lib/thesis-detail";

type PageProps = { params: Promise<{ ref: string }> };

export async function generateStaticParams() {
  const theses = loadCandidateTheses();
  return theses.map((t) => ({ ref: t.ref }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ref } = await params;
  const state = getRankingState();
  const thesis = getRankedThesisByRef(ref, state.ranked);
  if (!thesis) return { title: "Idea not found · Hatch105" };
  return {
    title: `${thesis.title} · Hatch105`,
    description: thesis.thesis?.one_liner ?? thesis.verdict,
  };
}

export default async function IdeaDetailRoute({ params }: PageProps) {
  const { ref } = await params;
  const state = getRankingState();
  const thesis = getRankedThesisByRef(ref, state.ranked);

  if (!thesis) notFound();

  const benchmarks = getCohortBenchmarks(state.ranked);
  const adjacent = getAdjacentRefs(state.ranked, thesis.ref);

  return (
    <div className="min-h-full bg-white">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10 pb-28">
        <ThesisDetailPage
          thesis={thesis}
          benchmarks={benchmarks}
          adjacent={adjacent}
          ranked={state.ranked}
        />
      </main>
      <CompareTray />
    </div>
  );
}
