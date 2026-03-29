'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type CpThemeId = 'harmony' | 'elegance' | 'classic';

export const CP_THEME_STORAGE_KEY = 'cp-theme';

/** Default when no saved choice or unknown value — matches `:root` in globals.css */
export const CP_THEME_DEFAULT: CpThemeId = 'classic';

const ThemeContext = createContext<{
  theme: CpThemeId;
  setTheme: (t: CpThemeId) => void;
} | null>(null);

function parseThemeId(raw: string | null): CpThemeId {
  if (raw === 'elegance' || raw === 'classic' || raw === 'harmony') return raw;
  return CP_THEME_DEFAULT;
}

function readThemeFromDom(): CpThemeId {
  if (typeof document === 'undefined') return CP_THEME_DEFAULT;
  return parseThemeId(document.documentElement.getAttribute('data-cp-theme'));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<CpThemeId>(CP_THEME_DEFAULT);

  useLayoutEffect(() => {
    setThemeState(readThemeFromDom());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CP_THEME_STORAGE_KEY || e.newValue == null) return;
      const t = parseThemeId(e.newValue);
      setThemeState(t);
      document.documentElement.setAttribute('data-cp-theme', t);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((t: CpThemeId) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-cp-theme', t);
    try {
      localStorage.setItem(CP_THEME_STORAGE_KEY, t);
    } catch {
      /* private mode */
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useCpTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useCpTheme must be used within ThemeProvider');
  return ctx;
}
