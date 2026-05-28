"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RANKING_UPDATED_EVENT,
  type RankingUpdatedDetail,
} from "@/lib/ranking-sync";

export type PortfolioColumn = "considering" | "building" | "passed";

export type PortfolioState = Record<PortfolioColumn, string[]>;

const STORAGE_KEY = "hatch105-portfolio-v1";

const EMPTY: PortfolioState = {
  considering: [],
  building: [],
  passed: [],
};

function load(): PortfolioState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

export function usePortfolio() {
  const [state, setState] = useState<PortfolioState>(() => load());

  useEffect(() => {
    const onRankingUpdated = (event: Event) => {
      const detail = (event as CustomEvent<RankingUpdatedDetail>).detail;
      const valid = detail?.rankedRefs;
      if (!valid?.length) return;
      const allowed = new Set(valid);
      setState((prev) => {
        const next: PortfolioState = {
          considering: prev.considering.filter((r) => allowed.has(r)),
          building: prev.building.filter((r) => allowed.has(r)),
          passed: prev.passed.filter((r) => allowed.has(r)),
        };
        if (
          next.considering.length === prev.considering.length &&
          next.building.length === prev.building.length &&
          next.passed.length === prev.passed.length
        ) {
          return prev;
        }
        return next;
      });
    };
    window.addEventListener(RANKING_UPDATED_EVENT, onRankingUpdated);
    return () =>
      window.removeEventListener(RANKING_UPDATED_EVENT, onRankingUpdated);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const move = useCallback((ref: string, to: PortfolioColumn) => {
    setState((prev) => {
      const next: PortfolioState = {
        considering: prev.considering.filter((r) => r !== ref),
        building: prev.building.filter((r) => r !== ref),
        passed: prev.passed.filter((r) => r !== ref),
      };
      next[to] = [...next[to], ref];
      return next;
    });
  }, []);

  const columnFor = useCallback(
    (ref: string): PortfolioColumn | null => {
      if (state.considering.includes(ref)) return "considering";
      if (state.building.includes(ref)) return "building";
      if (state.passed.includes(ref)) return "passed";
      return null;
    },
    [state]
  );

  return { state, move, columnFor };
}
