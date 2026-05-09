'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, activeMode, setTheme } = useAppStore();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const nextTheme = savedTheme === 'dark' ? 'dark' : 'light';

    if (theme !== nextTheme) {
      setTheme(nextTheme);
    }
  }, [setTheme, theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-app-mode', activeMode);
  }, [activeMode]);

  return <>{children}</>;
}
