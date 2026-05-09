'use client';

import { Conversation } from '@/types';
import { formatTimestamp } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationList({ conversations, currentId, onSelect, onDelete }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="text-2xl mb-2 opacity-40">💬</div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          暂无对话记录
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 py-1">
      {conversations.map((conversation) => {
        const isActive = currentId === conversation.id;
        const lastMessage = conversation.messages.filter(m => m.role !== 'system').at(-1);
        const preview = lastMessage
          ? lastMessage.content.substring(0, 40) + (lastMessage.content.length > 40 ? '...' : '')
          : '暂无消息';

        return (
          <div
            key={conversation.id}
            className="group relative flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all animate-fade-in"
            style={{
              background: isActive ? 'var(--bg-elevated)' : 'transparent',
              border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
            }}
            onClick={() => onSelect(conversation.id)}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--bg-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {/* Icon */}
            <div
              className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs"
              style={{
                background: isActive ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? '#a78bfa' : 'var(--text-muted)',
              }}
            >
              {conversation.mode === 'writing' ? '✍️' : '💬'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium truncate"
                style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                {conversation.title}
              </div>
              <div
                className="text-xs truncate mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {preview}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: 'var(--text-muted)', opacity: 0.6 }}
              >
                {formatTimestamp(conversation.updatedAt)}
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conversation.id);
              }}
              className="absolute right-2 top-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
              aria-label="删除对话"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
