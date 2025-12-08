'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

type ThemeProviderProps = {
  children: React.ReactNode;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({
  children,
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  // Initial theme is "light" during SSR
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem(storageKey, nextTheme);
  };

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;

    const system = getSystemTheme();

    const initial = stored || system;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial);
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.dataset.theme = theme;
  }, [theme]);

  return (
    <ThemeProviderContext.Provider {...props} value={{ theme, toggleTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
