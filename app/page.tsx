import { RankingDashboard } from "@/components/RankingDashboard";
import { AppHeader } from "@/components/AppHeader";

export default function Home() {
  return (
    <div className="min-h-full bg-white">
      <AppHeader />

      <main className="mx-auto max-w-4xl bg-white px-6 py-10">
        <p className="hatch-label mb-2">Rankings</p>
        <h1 className="mb-10 text-3xl font-semibold tracking-tight text-slate-900">
          Startup thesis rankings
        </h1>

        <RankingDashboard />
      </main>
    </div>
  );
}
