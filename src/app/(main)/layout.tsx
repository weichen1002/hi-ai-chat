'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Sidebar } from '@/components/sidebar/sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loadConversations, createConversation, currentConversationId, conversations, sidebarOpen, setSidebarOpen } = useAppStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      loadConversations();
      setInitialized(true);
    }
  }, [initialized, loadConversations]);

  useEffect(() => {
    if (initialized && conversations.length === 0 && !currentConversationId) {
      createConversation('chat');
    }
  }, [initialized, conversations, currentConversationId, createConversation]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
          }}
          aria-label="打开菜单"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
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
