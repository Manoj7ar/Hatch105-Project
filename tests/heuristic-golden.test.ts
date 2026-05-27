import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { ThesisSchema } from "@/lib/types";
import { scoreThesisHeuristic } from "@/lib/heuristic";

const golden = JSON.parse(
  readFileSync(join(__dirname, "fixtures/golden-theses.json"), "utf-8")
) as unknown[];

describe("heuristic golden snapshots", () => {
  for (const raw of golden) {
    const t = ThesisSchema.parse(raw);
    it(`${t.ref} matches expected gates and fit band`, () => {
      const score = scoreThesisHeuristic(t);
      expect(score.ref).toBe(t.ref);
      expect(score.criteria.buildability.evidence).toBeDefined();

      if (t.ref === "H-03") {
        expect(score.gatesTriggered).toContain("G3D");
        expect(score.fit).toBeLessThan(3);
      }
      if (t.ref === "H-08") {
        expect(score.fit).toBeGreaterThanOrEqual(4);
      }
      if (t.ref === "H-41") {
        expect(score.gatesTriggered).toContain("AUTO_REPRICE");
      }
    });
  }
});
