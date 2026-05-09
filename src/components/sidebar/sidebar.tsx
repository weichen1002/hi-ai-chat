'use client';

import { useAppStore } from '@/stores/app-store';
import { ConversationList } from './conversation-list';
import { ModelSelector } from './model-selector';
import { ThemeToggle } from './theme-toggle';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const {
    conversations,
    currentConversationId,
    createConversation,
    deleteConversation,
    setCurrentConversation,
    activeMode,
    setActiveMode,
  } = useAppStore();

  const handleNewConversation = () => {
    createConversation(activeMode);
    onClose();
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id);
    onClose();
  };

  const handleDeleteConversation = (id: string) => {
    deleteConversation(id);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-default)',
      }}
    >
      {/* Logo & Brand */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
          style={{ background: 'var(--accent-gradient)' }}
        >
          Hi
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Hi AI Chat</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>智能对话平台</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          aria-label="关闭侧边栏"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-4 py-3">
        <button
          onClick={handleNewConversation}
          className="btn-gradient w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新对话
        </button>
      </div>

      {/* Mode Tabs */}
      <div className="px-4 pb-3">
        <div
          className="flex rounded-xl p-1"
          style={{ background: 'var(--bg-primary)' }}
        >
          <button
            onClick={() => setActiveMode('chat')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeMode === 'chat' ? 'var(--bg-elevated)' : 'transparent',
              color: activeMode === 'chat' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeMode === 'chat' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            对话
          </button>
          <button
            onClick={() => setActiveMode('writing')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeMode === 'writing' ? 'var(--bg-elevated)' : 'transparent',
              color: activeMode === 'writing' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeMode === 'writing' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            写作
          </button>
        </div>
      </div>

      {/* Model Selector */}
      <div className="px-4 pb-3">
        <ModelSelector />
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2">
        <ConversationList
          conversations={conversations.filter(c => c.mode === activeMode)}
          currentId={currentConversationId}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
        />
      </div>

      {/* Bottom: Theme Toggle */}
      <div
        className="p-4"
        style={{ borderTop: '1px solid var(--border-default)' }}
      >
        <ThemeToggle />
      </div>
    </aside>
  );
}
