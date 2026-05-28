import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { ThesisDetailPage } from "@/components/thesis/ThesisDetailPage";
import { CompareTray } from "@/components/CompareTray";
import { getRankingState, loadAllTheses, loadResearch } from "@/lib/data";
import { ensureThesisProfile } from "@/lib/ensure-thesis-profile";
import type { ResearchResult } from "@/lib/research";
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
  let thesis = getRankedThesisByRef(ref, state.ranked);

  if (!thesis) notFound();

  thesis = await ensureThesisProfile(ref, thesis);

  const research = loadResearch(ref) as ResearchResult | null;

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
          research={research}
        />
      </main>
      <CompareTray />
    </div>
  );
}
