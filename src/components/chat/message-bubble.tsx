'use client';

import { useState, useCallback } from 'react';
import { Message } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import { MarkdownRenderer } from './markdown-renderer';

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
  onRegenerate?: () => void;
}

export function MessageBubble({ message, isLatest, onRegenerate }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [message.content]);

  if (message.role === 'system') return null;

  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
          style={{ background: 'var(--accent-gradient)' }}
        >
          AI
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-[80%] min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${isUser ? 'user-bubble' : 'ai-bubble'}`}
          style={isUser ? {
            background: 'var(--msg-user-bg, var(--accent-gradient))',
            color: 'var(--msg-user-text, #ffffff)',
            borderBottomRightRadius: '4px',
            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.2)',
          } : {
            background: 'var(--msg-ai-bg, var(--bg-secondary))',
            border: '1px solid var(--msg-ai-border, var(--border-default))',
            color: 'var(--msg-ai-text, var(--text-primary))',
            borderBottomLeftRadius: '4px',
          }}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Action Bar */}
        <div className={`flex items-center gap-1 mt-1.5 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs px-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            {formatTimestamp(message.timestamp)}
          </span>

          {!isUser && message.content && (
            <>
              <button
                onClick={handleCopy}
                className="p-1 rounded-md transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
                title={copied ? '已复制' : '复制消息'}
              >
                {copied ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              {isLatest && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1 rounded-md transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                  title="重新生成"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{
            background: 'rgba(124, 58, 237, 0.15)',
            color: '#a78bfa',
          }}
        >
          你
        </div>
      )}
    </div>
  );
}
