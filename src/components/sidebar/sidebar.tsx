'use client';

import { AppMode } from '@/types';
import { useAppStore } from '@/stores/app-store';
import { ConversationList } from './conversation-list';
import { ModelSelector } from './model-selector';
import { ThemeToggle } from './theme-toggle';
import { GenerationControls } from './generation-controls';

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

  const handleModeSwitch = (mode: AppMode) => {
    setActiveMode(mode);
    onClose();
  };

  const modeItems: Array<{ mode: AppMode; label: string; icon: string }> = [
    { mode: 'chat', label: '对话', icon: '💬' },
    { mode: 'writing', label: '写作', icon: '✍️' },
  ];

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
        width: 'min(92vw, 22rem)',
        minWidth: 'min(92vw, 22rem)',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-default)',
      }}
    >
      {/* Logo & Brand */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-5 sm:px-5" style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
          style={{ background: 'var(--accent-gradient)' }}
        >
          Hi
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold tracking-[0.08em]" style={{ color: 'var(--text-primary)' }}>Story Console</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>对话与写作一体化</p>
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
          className="btn-gradient w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium touch-manipulation"
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
          className="grid grid-cols-2 rounded-2xl p-1.5"
          style={{ background: 'var(--panel-muted)' }}
        >
          {modeItems.map((item) => {
            const isActive = activeMode === item.mode;

            return (
              <button
                key={item.mode}
                onClick={() => handleModeSwitch(item.mode)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Selector */}
      <div className="px-4 pb-3">
        <ModelSelector />
      </div>

      <div className="px-4 pb-3">
        <GenerationControls />
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
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
        style={{ borderTop: '1px solid var(--border-default)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <ThemeToggle />
      </div>
    </aside>
  );
}
