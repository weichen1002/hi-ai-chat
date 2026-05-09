'use client';

import { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onStop?: () => void;
}

export function MessageInput({ onSendMessage, isLoading, onStop }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [message]);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div
        className="flex items-end gap-2 rounded-2xl p-2 transition-all"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)' }}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，Shift+Enter 换行..."
          disabled={isLoading}
          className="flex-1 resize-none bg-transparent border-none outline-none text-sm leading-relaxed px-2 py-1.5"
          style={{ color: 'var(--text-primary)', minHeight: '24px', maxHeight: '160px' }}
          rows={1}
        />
        <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
          {message.length > 0 && (
            <span className="text-xs tabular-nums px-1" style={{ color: message.length > 4000 ? '#ef4444' : 'var(--text-muted)' }}>
              {message.length}
            </span>
          )}
          {isLoading ? (
            <button
              onClick={onStop}
              className="p-2 rounded-xl transition-all flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
              title="停止生成"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!message.trim()}
              className="btn-gradient p-2 rounded-xl transition-all flex items-center justify-center disabled:opacity-30"
              title="发送消息"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="text-center mt-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>AI 生成的内容可能不准确，请注意甄别</span>
      </div>
    </div>
  );
}
