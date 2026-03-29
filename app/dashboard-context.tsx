'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { DashboardStatsPayload } from '@/src/lib/dashboard-stats';

type DashboardContextValue = {
  stats: DashboardStatsPayload | null;
  lastLikedCardId: string | null;
  refreshDashboard: (lastLikedCardId?: string) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

const HIGHLIGHT_MS = 1500;

export function DashboardStatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<DashboardStatsPayload | null>(null);
  const [lastLikedCardId, setLastLikedCardId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHighlightTimer = useCallback(() => {
    if (highlightTimer.current != null) {
      clearTimeout(highlightTimer.current);
      highlightTimer.current = null;
    }
  }, []);

  const refreshDashboard = useCallback(
    (likedId?: string) => {
      if (likedId) {
        clearHighlightTimer();
        setLastLikedCardId(likedId);
        highlightTimer.current = setTimeout(() => {
          setLastLikedCardId(null);
          highlightTimer.current = null;
        }, HIGHLIGHT_MS);
      }
      void (async () => {
        try {
          const r = await fetch('/api/dashboard/stats', { credentials: 'include' });
          if (!r.ok) return;
          const j = (await r.json()) as DashboardStatsPayload;
          setStats(j);
        } catch {
          /* ignore */
        }
      })();
    },
    [clearHighlightTimer],
  );

  useEffect(() => () => clearHighlightTimer(), [clearHighlightTimer]);

  const value = useMemo<DashboardContextValue>(
    () => ({ stats, lastLikedCardId, refreshDashboard }),
    [stats, lastLikedCardId, refreshDashboard],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardStats(): DashboardContextValue | null {
  return useContext(DashboardContext);
}
