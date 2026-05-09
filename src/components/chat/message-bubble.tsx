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
    <div
      className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ marginBottom: '24px' }}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1"
        style={
          isUser
            ? {
                background: 'rgba(124, 58, 237, 0.15)',
                color: '#a78bfa',
                border: '1px solid rgba(124, 58, 237, 0.2)',
              }
            : {
                background: 'var(--accent-gradient)',
                color: '#ffffff',
              }
        }
      >
        {isUser ? '你' : 'AI'}
      </div>

      {/* Message Content */}
      <div
        className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'}`}
        style={{ maxWidth: '75%' }}
      >
        {/* Role Label */}
        <div
          className="text-xs font-medium mb-1.5 px-1"
          style={{
            color: isUser ? '#a78bfa' : 'var(--text-muted)',
            opacity: 0.8,
          }}
        >
          {isUser ? '你' : 'AI 助手'}
        </div>

        {/* Bubble */}
        <div
          className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
          style={
            isUser
              ? {
                  background: 'var(--accent-gradient)',
                  color: '#ffffff',
                  borderBottomRightRadius: '4px',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                }
              : {
                  background: 'var(--msg-ai-bg, var(--bg-secondary))',
                  border: '1px solid var(--msg-ai-border, var(--border-default))',
                  color: 'var(--msg-ai-text, var(--text-primary))',
                  borderBottomLeftRadius: '4px',
                }
          }
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Action Bar */}
        <div
          className={`flex items-center gap-1 mt-1.5 px-1 ${isUser ? 'flex-row-reverse' : ''}`}
        >
          <span
            className="text-xs"
            style={{ color: 'var(--text-muted)', opacity: 0.5 }}
          >
            {formatTimestamp(message.timestamp)}
          </span>

          {!isUser && message.content && (
            <>
              <span
                className="text-xs mx-1"
                style={{ color: 'var(--text-muted)', opacity: 0.2 }}
              >
                |
              </span>
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
    </div>
  );
}
