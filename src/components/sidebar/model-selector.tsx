'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { AVAILABLE_MODELS } from '@/lib/api';

export function ModelSelector() {
  const { conversations, currentConversationId, updateConversation } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const selectedModel = currentConversation?.model || 'gpt-5.4';
  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  const handleModelChange = (modelId: string) => {
    if (currentConversationId) {
      updateConversation(currentConversationId, { model: modelId });
    }
    setIsOpen(false);
  };

  const modelIcons: Record<string, string> = {
    'gpt-5-mini': '⚡',
    'gpt-5': '🧠',
    'gpt-5.4': '🚀',
    'gpt-5.5': '✨',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--border-default)';
          }
        }}
      >
        <span className="text-base">{modelIcons[selectedModel] || '🤖'}</span>
        <span className="flex-1 text-left truncate text-xs font-medium">{currentModel?.name || selectedModel}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-20 animate-slide-up"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelChange(model.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                style={{
                  background: model.id === selectedModel ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                  color: model.id === selectedModel ? 'var(--text-accent)' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (model.id !== selectedModel) {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (model.id !== selectedModel) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span className="text-base">{modelIcons[model.id] || '🤖'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{model.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {model.description}
                  </div>
                </div>
                {model.id === selectedModel && (
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
