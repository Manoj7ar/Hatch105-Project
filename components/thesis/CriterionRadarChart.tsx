import { CRITERION_KEYS, type CriterionKey, type RankedThesis } from "@/lib/types";
import { CRITERION_LABELS } from "@/lib/criteria";
import type { CohortBenchmarks } from "@/lib/thesis-detail";

const SIZE = 220;
const CENTER = SIZE / 2;
const MAX_R = 72;
const LEVELS = [1, 2, 3, 4, 5];

function point(angle: number, value: number): { x: number; y: number } {
  const r = (value / 5) * MAX_R;
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

function polygonPoints(
  values: number[],
  keys: readonly CriterionKey[]
): string {
  return keys
    .map((key, i) => {
      const angle = (360 / keys.length) * i;
      const p = point(angle, values[i] ?? 0);
      return `${p.x},${p.y}`;
    })
    .join(" ");
}

export function CriterionRadarChart({
  thesis,
  benchmarks,
}: {
  thesis: RankedThesis;
  benchmarks: CohortBenchmarks;
}) {
  const teamValues = CRITERION_KEYS.map((k) => thesis.criteria[k].score);
  const cohortValues = CRITERION_KEYS.map(
    (k) => benchmarks.criterionAverages[k]
  );

  const teamPoly = polygonPoints(teamValues, CRITERION_KEYS);
  const cohortPoly = polygonPoints(cohortValues, CRITERION_KEYS);

  return (
    <figure className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <figcaption className="hatch-label mb-3">Criterion radar</figcaption>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto h-auto w-full max-w-[240px]"
        role="img"
        aria-label={`Radar chart comparing ${thesis.title} to cohort averages across six criteria`}
      >
        {LEVELS.map((level) => (
          <polygon
            key={level}
            points={polygonPoints(
              CRITERION_KEYS.map(() => level),
              CRITERION_KEYS
            )}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={level === 5 ? 1 : 0.5}
          />
        ))}
        {CRITERION_KEYS.map((key, i) => {
          const angle = (360 / CRITERION_KEYS.length) * i;
          const end = point(angle, 5);
          const label = point(angle, 5.85);
          const short = CRITERION_LABELS[key].split(" ")[0] ?? key;
          return (
            <g key={key}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={end.x}
                y2={end.y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-500 text-[8px]"
              >
                {short}
              </text>
            </g>
          );
        })}
        <polygon
          points={cohortPoly}
          fill="rgba(100, 116, 139, 0.08)"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <polygon
          points={teamPoly}
          fill="var(--groq-orange-muted)"
          stroke="var(--groq-orange)"
          strokeWidth={2}
        />
        {teamValues.map((v, i) => {
          const angle = (360 / CRITERION_KEYS.length) * i;
          const p = point(angle, v);
          return (
            <circle
              key={CRITERION_KEYS[i]}
              cx={p.x}
              cy={p.y}
              r={3}
              fill="var(--groq-orange)"
            />
          );
        })}
      </svg>
      <div className="mt-3 flex justify-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--groq-orange)]" />
          {thesis.ref}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 border-t-2 border-dashed border-slate-400" />
          Cohort avg
        </span>
      </div>
      <table className="sr-only">
        <caption>Criterion scores</caption>
        <thead>
          <tr>
            <th>Criterion</th>
            <th>Team</th>
            <th>Cohort</th>
          </tr>
        </thead>
        <tbody>
          {CRITERION_KEYS.map((key) => (
            <tr key={key}>
              <td>{CRITERION_LABELS[key]}</td>
              <td>{thesis.criteria[key].score}</td>
              <td>{benchmarks.criterionAverages[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
