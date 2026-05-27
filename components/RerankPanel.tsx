"use client";

import { Upload } from "lucide-react";
import { Button } from "./ui/Button";

export function RerankPanel({
  value,
  onChange,
  onFile,
  onSubmit,
  loading,
  placements,
}: {
  value: string;
  onChange: (v: string) => void;
  onFile: (file: File) => void;
  onSubmit: () => void;
  loading: boolean;
  placements: { ref: string; rank: number; summary: string }[];
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Add new theses</h3>
        <p className="mt-1 text-sm text-slate-500">
          Paste JSON or CSV in the same format as the candidate file. The full set is
          re-ranked with the same criteria and gates.
        </p>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          placeholder={`[\n  {\n    "ref": "H-51",\n    "title": "...",\n    "one_liner": "...",\n    "example_customer": "...",\n    "wedge": "..."\n  }\n]`}
          className="mt-4 w-full resize-y rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-3 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              Upload file
            </span>
            <input
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </label>
          <Button
            onClick={onSubmit}
            disabled={loading || !value.trim()}
          >
            {loading ? "Re-ranking…" : "Re-rank full set"}
          </Button>
        </div>
      </div>

      {placements.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Placement summary</h3>
          <ul className="mt-4 space-y-3">
            {placements.map((p) => (
              <li
                key={p.ref}
                className="border-l-2 border-slate-200 pl-4 text-sm leading-relaxed text-slate-600"
              >
                <span className="font-mono font-medium text-slate-800">{p.ref}</span>
                <span className="text-slate-400"> · rank {p.rank}</span>
                <p className="mt-0.5">{p.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
