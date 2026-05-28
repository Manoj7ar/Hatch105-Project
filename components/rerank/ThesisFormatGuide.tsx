"use client";

import { FileJson, Sheet } from "lucide-react";
import { THESIS_CSV_HEADER, THESIS_JSON_EXAMPLE } from "@/lib/thesis-input-client";

export function ThesisFormatGuide({
  format,
  onInsertExample,
}: {
  format: "json" | "csv";
  onInsertExample: () => void;
}) {
  return (
    <div className="rerank-format-guide">
      <div className="flex items-center gap-2">
        {format === "json" ? (
          <FileJson className="h-4 w-4 text-[var(--gemini-accent)]" />
        ) : (
          <Sheet className="h-4 w-4 text-[var(--gemini-accent)]" />
        )}
        <h4 className="text-sm font-semibold text-slate-900">
          {format === "json" ? "JSON array" : "CSV with header row"}
        </h4>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        Required fields:{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] ring-1 ring-slate-200">
          ref
        </code>
        ,{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] ring-1 ring-slate-200">
          title
        </code>
        ,{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] ring-1 ring-slate-200">
          one_liner
        </code>
        ,{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] ring-1 ring-slate-200">
          example_customer
        </code>
        ,{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] ring-1 ring-slate-200">
          wedge
        </code>
        . Use unique refs like{" "}
        <code className="font-mono text-[11px]">H-51</code> for new ideas.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-700 ring-1 ring-slate-200">
        {format === "json" ? THESIS_JSON_EXAMPLE : THESIS_CSV_HEADER}
      </pre>
      {format === "json" && (
        <button
          type="button"
          onClick={onInsertExample}
          className="mt-2 text-xs font-medium text-[var(--gemini-accent)] hover:underline"
        >
          Insert example JSON
        </button>
      )}
    </div>
  );
}
