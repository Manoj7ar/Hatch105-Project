"use client";

import { useCallback, useEffect, useState } from "react";
import type { TeamOption } from "@/lib/teams";
import { RANKING_UPDATED_EVENT } from "@/lib/ranking-sync";

export function useTeams() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/teams", { cache: "no-store" });
      const data = (await res.json()) as { teams?: TeamOption[] };
      if (res.ok && data.teams) setTeams(data.teams);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onUpdate = () => {
      void reload();
    };
    window.addEventListener(RANKING_UPDATED_EVENT, onUpdate);
    window.addEventListener("focus", onUpdate);
    return () => {
      window.removeEventListener(RANKING_UPDATED_EVENT, onUpdate);
      window.removeEventListener("focus", onUpdate);
    };
  }, [reload]);

  return { teams, loading, reload };
}
