'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { flushConversationSave } from '@/lib/storage';

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

  useEffect(() => {
    const flushPendingSave = () => {
      void flushConversationSave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSave();
      }
    };

    window.addEventListener('beforeunload', flushPendingSave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', flushPendingSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
}
