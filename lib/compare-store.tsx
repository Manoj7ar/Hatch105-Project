"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  RANKING_UPDATED_EVENT,
  type RankingUpdatedDetail,
} from "@/lib/ranking-sync";

const STORAGE_KEY = "hatch105-compare";
const MAX_COMPARE = 4;

type CompareContextValue = {
  refs: string[];
  add: (ref: string) => boolean;
  remove: (ref: string) => void;
  clear: () => void;
  has: (ref: string) => boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

function loadRefs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [refs, setRefs] = useState<string[]>(() => loadRefs());

  useEffect(() => {
    const onRankingUpdated = (event: Event) => {
      const detail = (event as CustomEvent<RankingUpdatedDetail>).detail;
      const valid = detail?.rankedRefs;
      if (!valid?.length) return;
      const allowed = new Set(valid);
      setRefs((prev) => {
        const next = prev.filter((r) => allowed.has(r));
        return next.length === prev.length ? prev : next;
      });
    };
    window.addEventListener(RANKING_UPDATED_EVENT, onRankingUpdated);
    return () =>
      window.removeEventListener(RANKING_UPDATED_EVENT, onRankingUpdated);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(refs));
  }, [refs]);

  const add = useCallback((ref: string) => {
    let added = false;
    setRefs((prev) => {
      if (prev.includes(ref)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      added = true;
      return [...prev, ref];
    });
    return added;
  }, []);

  const remove = useCallback((ref: string) => {
    setRefs((prev) => prev.filter((r) => r !== ref));
  }, []);

  const clear = useCallback(() => setRefs([]), []);

  const has = useCallback((ref: string) => refs.includes(ref), [refs]);

  const value = useMemo(
    () => ({ refs, add, remove, clear, has }),
    [refs, add, remove, clear, has]
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
