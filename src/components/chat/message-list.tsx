'use client';

import { Message } from '@/types';
import { useAppStore } from '@/stores/app-store';
import { MessageBubble } from './message-bubble';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage?: (content: string) => void;
  onRegenerate?: () => void;
}

const QUICK_PROMPTS = [
  {
    icon: '💡',
    title: '解释概念',
    prompt: '请用简单的方式解释一下什么是量子计算',
  },
  {
    icon: '📝',
    title: '写一篇文章',
    prompt: '帮我写一篇关于人工智能发展趋势的短文',
  },
  {
    icon: '🐛',
    title: '调试代码',
    prompt: '帮我分析并修复以下代码中的bug',
  },
  {
    icon: '🎨',
    title: '创意灵感',
    prompt: '给我提供5个有创意的移动应用开发点子',
  },
];

export function MessageList({ messages, isLoading, onSendMessage, onRegenerate }: MessageListProps) {
  const { activeMode } = useAppStore();
  const isWritingMode = activeMode !== 'chat';
  const visibleMessages = messages.filter(m => m.role !== 'system');

  if (visibleMessages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full animate-fade-in">
        <div className="text-center max-w-lg px-4">
          <div className="mb-2">
            <span className="text-5xl">✨</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 gradient-text">有什么可以帮你的？</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            我是你的 AI 助手，可以回答问题、写代码、创作内容，以及更多
          </p>

          {onSendMessage && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUICK_PROMPTS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => onSendMessage(item.prompt)}
                  className="text-left p-4 rounded-2xl transition-all group"
                  style={{
                    background: 'var(--panel-surface)',
                    border: '1px solid var(--border-default)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span className="text-xl mb-2 block">{item.icon}</span>
                  <span className="text-sm font-medium block" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </span>
                  <span className="text-xs mt-1 block" style={{ color: 'var(--text-muted)' }}>
                    {item.prompt.substring(0, 30)}...
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isWritingMode ? 'writing-thread' : ''}`}>
      {visibleMessages.map((message, index) => {
        const previousMessage = visibleMessages[index - 1];
        const isLastAssistant = message.role === 'assistant' &&
          index === visibleMessages.length - 1;
        const isStreamingPlaceholder =
          isLoading &&
          isLastAssistant &&
          message.role === 'assistant' &&
          message.content === '';
        const showAssistantDivider =
          message.role === 'assistant' &&
          previousMessage?.role === 'user';

        if (isStreamingPlaceholder) {
          return null;
        }

        return (
          <div key={message.id}>
            {showAssistantDivider && (
              <div className="message-divider" aria-hidden="true">
                <span className="divider-dot" />
              </div>
            )}
            <MessageBubble
              message={message}
              isLatest={isLastAssistant}
              onRegenerate={isLastAssistant ? onRegenerate : undefined}
            />
          </div>
        );
      })}

      {/* Typing indicator */}
      {isLoading && visibleMessages[visibleMessages.length - 1]?.role === 'assistant' &&
        visibleMessages[visibleMessages.length - 1]?.content === '' && (
          <div className="flex gap-3 animate-slide-up">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ background: 'var(--accent-gradient)' }}
            >
              {isWritingMode ? '稿' : 'AI'}
            </div>
            <div
              className={`rounded-2xl px-4 py-3 ${isWritingMode ? 'writing-ai-response' : ''}`}
              style={{
                background: 'var(--panel-surface)',
                border: '1px solid var(--border-default)',
                borderBottomLeftRadius: '6px',
              }}
            >
              <div className="typing-indicator">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
