import type { GateId } from "./gates";
import { TRAP_REFS } from "./criteria";
import type { RankedThesis } from "./types";

export const GATE_LABELS: Record<GateId, string> = {
  G3D: "Generative 3D / AR (build cap)",
  REALTIME_AI: "Realtime AI / live media (build cap)",
  INCUMBENT_WAR: "Incumbent price war (trap cap)",
  POS_ENTERPRISE: "POS / enterprise motion (distribution cap)",
  AUTO_REPRICE: "Autonomous repricing (trap cap)",
};

export type TrapStoryId =
  | "paperTitan"
  | "incumbentSqueeze"
  | "scopeOrPlatform"
  | "lowFitTrap";

export type TrapStory = {
  id: TrapStoryId;
  title: string;
  blurb: string;
  theses: RankedThesis[];
};

const PAPER_TITAN_REFS = new Set(["H-03", "H-11", "H-20", "H-32"]);
const SCOPE_REFS = new Set(["H-25", "H-41"]);

const STORY_META: Record<
  TrapStoryId,
  { title: string; blurb: string }
> = {
  paperTitan: {
    title: "Paper titans",
    blurb:
      "Big market, wrong physics for a 3-person Hatch sprint — generative 3D, realtime PDP AI, or live video stacks read as research problems, not App Store apps.",
  },
  incumbentSqueeze: {
    title: "Incumbent squeeze",
    blurb:
      "Strong merchant pain, but the wedge is price war vs Yotpo, Gorgias, Klaviyo, or Recharge. Our gate caps trap safety until the mechanic is clearly differentiated.",
  },
  scopeOrPlatform: {
    title: "Scope & platform traps",
    blurb:
      "POS-only motions, closed-loop repricing liability, or multi-app scope creep — real businesses that need a bigger team or narrower v1 than Hatch has this year.",
  },
  lowFitTrap: {
    title: "Low fit / swamp",
    blurb:
      "Composite Hatch Fit or trap safety fell below our build bar — not necessarily bad ideas, but wrong team size or timeline for this cohort.",
  },
};

function classifyTrapStory(thesis: RankedThesis): TrapStoryId | null {
  const gates = thesis.gatesTriggered as GateId[];

  if (
    gates.some((g) => g === "G3D" || g === "REALTIME_AI") ||
    PAPER_TITAN_REFS.has(thesis.ref)
  ) {
    return "paperTitan";
  }

  if (gates.includes("INCUMBENT_WAR")) {
    return "incumbentSqueeze";
  }

  if (
    gates.some((g) => g === "POS_ENTERPRISE" || g === "AUTO_REPRICE") ||
    SCOPE_REFS.has(thesis.ref)
  ) {
    return "scopeOrPlatform";
  }

  if (thesis.fit < 3.2 || thesis.criteria.trapRisk.score <= 2) {
    return "lowFitTrap";
  }

  if (TRAP_REFS.has(thesis.ref) || gates.length > 0) {
    return "lowFitTrap";
  }

  return null;
}

export function groupTrapStories(ranked: RankedThesis[]): TrapStory[] {
  const buckets = new Map<TrapStoryId, RankedThesis[]>();

  for (const thesis of ranked) {
    const id = classifyTrapStory(thesis);
    if (!id) continue;
    const list = buckets.get(id) ?? [];
    list.push(thesis);
    buckets.set(id, list);
  }

  const order: TrapStoryId[] = [
    "paperTitan",
    "incumbentSqueeze",
    "scopeOrPlatform",
    "lowFitTrap",
  ];

  return order
    .filter((id) => (buckets.get(id)?.length ?? 0) > 0)
    .map((id) => ({
      id,
      ...STORY_META[id],
      theses: (buckets.get(id) ?? []).sort((a, b) => a.rank - b.rank),
    }));
}

export function formatGatesLine(gates: string[]): string {
  if (gates.length === 0) return "";
  return gates.map((g) => GATE_LABELS[g as GateId] ?? g).join("; ");
}
