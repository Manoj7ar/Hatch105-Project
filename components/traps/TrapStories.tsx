import Link from "next/link";
import type { TrapStory } from "@/lib/thesis-insights";
import { ideaPath } from "@/lib/idea-path";

export function TrapStories({ stories }: { stories: TrapStory[] }) {
  if (stories.length === 0) {
    return (
      <p className="text-sm text-slate-500">No trap narratives match the current ranking.</p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {stories.map((story) => (
        <article
          key={story.id}
          className="rounded-xl border border-slate-200 bg-slate-50/50 p-5"
        >
          <h3 className="text-base font-semibold text-slate-900">{story.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{story.blurb}</p>
          <ul className="mt-4 space-y-2">
            {story.theses.slice(0, 6).map((t) => (
              <li key={t.ref} className="flex items-center justify-between gap-2 text-sm">
                <Link href={ideaPath(t.ref)} className="min-w-0 font-medium text-slate-800 hover:underline">
                  <span className="font-mono text-slate-400">{t.ref}</span> {t.title}
                </Link>
                <span className="shrink-0 font-mono text-xs text-slate-500">
                  #{t.rank} · {t.fit}
                </span>
              </li>
            ))}
          </ul>
          {story.theses.length > 6 && (
            <p className="mt-2 text-xs text-slate-400">
              +{story.theses.length - 6} more in full list below
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
