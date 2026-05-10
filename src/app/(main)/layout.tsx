'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Sidebar } from '@/components/sidebar/sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loadConversations, createConversation, sidebarOpen, setSidebarOpen, activeMode } = useAppStore();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      void (async () => {
        const conversations = await loadConversations();
        if (conversations.length === 0) {
          createConversation('chat');
        }
      })();
    }
  }, [loadConversations, createConversation]);

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] overflow-hidden" data-app-mode={activeMode} style={{ background: 'var(--bg-primary)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
