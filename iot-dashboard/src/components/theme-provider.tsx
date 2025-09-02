'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize from localStorage or system preference
    try {
      const stored = localStorage.getItem('theme');
      const systemDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial: Theme =
        stored === 'dark' || stored === 'light'
          ? (stored as Theme)
          : systemDark
          ? 'dark'
          : 'light';
      setThemeState(initial);
      applyThemeClass(initial);

      // Listen to system changes only if user hasn't explicitly chosen
      if (!stored && window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
          const next: Theme = e.matches ? 'dark' : 'light';
          setThemeState(next);
          applyThemeClass(next);
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
      }
    } finally {
      setMounted(true);
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem('theme', t);
    } catch {}
    applyThemeClass(t);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () =>
        setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme],
  );

  // Avoid flash of incorrect theme until mounted
  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
