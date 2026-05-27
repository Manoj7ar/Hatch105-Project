"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RankedThesis, ResearchCitation } from "@/lib/types";
import { Search, Scale, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GroqIcon } from "@/components/ui/GroqIcon";
import { useCompare } from "@/lib/compare-store";
import Link from "next/link";
import { ideaPath } from "@/lib/idea-path";

export function ThesisDetailActions({
  thesis,
  topPickRef,
}: {
  thesis: RankedThesis;
  topPickRef: string;
}) {
  const router = useRouter();
  const { add, has, remove } = useCompare();
  const [researchMode, setResearchMode] = useState<"grounded" | "external">(
    "grounded"
  );
  const [researching, setResearching] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [citations, setCitations] = useState<ResearchCitation[]>(
    thesis.researchCitations ?? []
  );
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideNote, setOverrideNote] = useState(thesis.overrideNote ?? "");
  const [savingOverride, setSavingOverride] = useState(false);

  const inCompare = has(thesis.ref);
  const chatHint = encodeURIComponent(`Tell me about @${thesis.title}`);

  const refresh = () => router.refresh();

  const handleResearch = async (rescore: boolean) => {
    setResearching(true);
    try {
      const res = await fetch(`/api/research/${thesis.ref}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: researchMode, rescore }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Research failed");
      setCitations(data.research?.citations ?? []);
      if (rescore) refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Research failed");
    } finally {
      setResearching(false);
      setRescoring(false);
    }
  };

  const saveOverride = async () => {
    setSavingOverride(true);
    try {
      const res = await fetch(`/api/overrides/${thesis.ref}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: overrideNote, action: "human_override" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }
      setOverrideOpen(false);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Override failed");
    } finally {
      setSavingOverride(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="text-xs"
          onClick={() => (inCompare ? remove(thesis.ref) : add(thesis.ref))}
        >
          <Scale className="h-3.5 w-3.5" />
          {inCompare ? "Remove from compare" : "Add to compare"}
        </Button>
        <Button
          variant="secondary"
          className="text-xs"
          onClick={() => setOverrideOpen(!overrideOpen)}
        >
          Edit override
        </Button>
        <Link
          href={`/chat?q=${chatHint}`}
          className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-xs font-medium text-[var(--groq-orange)] ring-1 ring-[#f9c4b0] hover:bg-[#fff0eb]"
        >
          Ask in chat
        </Link>
        {topPickRef !== thesis.ref && (
          <Link href={ideaPath(topPickRef)} className="hatch-link self-center text-xs">
            vs top pick →
          </Link>
        )}
      </div>

      {thesis.overrideNote && !overrideOpen && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          <span className="font-medium">Human override — </span>
          {thesis.overrideNote}
        </div>
      )}

      {overrideOpen && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <label className="block text-xs font-medium text-slate-500">
            Override note (paper trail)
          </label>
          <textarea
            value={overrideNote}
            onChange={(e) => setOverrideNote(e.target.value)}
            rows={3}
            className="hatch-focus-ring w-full px-3 py-2 text-sm"
          />
          <Button
            variant="primary"
            disabled={savingOverride || !overrideNote.trim()}
            onClick={saveOverride}
          >
            {savingOverride ? "Saving…" : "Save override"}
          </Button>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="hatch-label">Research & Groq</h2>
        <div className="mt-3 flex gap-2">
          {(["grounded", "external"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setResearchMode(m)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                researchMode === m
                  ? "bg-[var(--groq-orange)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-[#fff0eb] hover:text-[var(--groq-orange)]"
              }`}
            >
              {m === "grounded" ? "Grounded" : "External"}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline-accent"
            className="text-xs"
            disabled={researching}
            onClick={() => handleResearch(false)}
          >
            {researching && !rescoring ? (
              <Loader2 className="hatch-spinner h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            {researching && !rescoring ? "Researching…" : "Fetch snippets"}
          </Button>
          <Button
            variant="groq"
            className="text-xs"
            disabled={researching || rescoring}
            onClick={() => {
              setRescoring(true);
              void handleResearch(true);
            }}
          >
            {rescoring ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <GroqIcon size={14} inverted />
            )}
            {rescoring ? "Scoring with Groq…" : "Re-score with Groq"}
          </Button>
        </div>
        {citations.length > 0 && (
          <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm text-slate-600">
            {citations.map((c) => (
              <li key={c.index}>
                <span className="font-medium">[{c.index}]</span> {c.title}
                {c.url && (
                  <a
                    href={c.url}
                    className="ml-1 text-[var(--groq-orange)] underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    link
                  </a>
                )}
                <p className="mt-0.5 text-slate-500">{c.snippet.slice(0, 280)}…</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
