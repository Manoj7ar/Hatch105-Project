import Link from "next/link";
import type { RankGateTension } from "@/lib/thesis-insights";
import { ideaPath } from "@/lib/idea-path";
import { Badge } from "@/components/ui/Badge";

export function TensionTable({ tensions }: { tensions: RankGateTension[] }) {
  if (tensions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No high-rank ideas with active hard gates in this snapshot.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            <th className="px-4 py-3 font-medium text-slate-500">Rank</th>
            <th className="px-4 py-3 font-medium text-slate-500">Team</th>
            <th className="px-4 py-3 font-medium text-slate-500">Fit</th>
            <th className="px-4 py-3 font-medium text-slate-500">Gates</th>
            <th className="px-4 py-3 font-medium text-slate-500">Tension</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tensions.map((row) => (
            <tr key={row.ref} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 font-mono text-slate-600">#{row.rank}</td>
              <td className="px-4 py-3">
                <Link
                  href={ideaPath(row.ref)}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {row.title}
                </Link>
                <span className="ml-2 font-mono text-xs text-slate-400">{row.ref}</span>
              </td>
              <td className="px-4 py-3 font-mono font-semibold tabular-nums">{row.fit}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {row.gates.map((g) => (
                    <Badge key={g} variant="warning" className="font-mono text-[10px]">
                      {g}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="max-w-md px-4 py-3 text-slate-600">{row.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
