'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useAppStore } from '@/stores/app-store';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { sendChatMessage } from '@/lib/api';

interface ChatContainerProps {
  conversationId: string | null;
}

export function ChatContainer({ conversationId }: ChatContainerProps) {
  const {
    messages, isLoading, error,
    addMessage, updateLastMessage, removeLastMessage,
    setLoading, setError, setMessages,
    setAbortController, stopGeneration,
  } = useChatStore();
  const { conversations, addMessageToConversation, updateConversation, setSidebarOpen } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === conversationId);

  useEffect(() => {
    if (isLoading) return;

    if (currentConversation) {
      setMessages(currentConversation.messages);
    } else {
      setMessages([]);
    }
  }, [conversationId, currentConversation, isLoading, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const doSendMessage = useCallback(async (allMessages: { role: string; content: string }[], model: string) => {
    if (!conversationId) return;

    const assistantMessage = addMessage({ role: 'assistant' as const, content: '', model });
    addMessageToConversation(conversationId, assistantMessage);
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    setAbortController(controller);

    await sendChatMessage(
      allMessages,
      model,
      (chunk) => updateLastMessage(chunk),
      () => {
        setLoading(false);
        setAbortController(null);
        const updatedMessages = useChatStore.getState().messages;
        const conv = useAppStore.getState().conversations.find(c => c.id === conversationId);
        updateConversation(conversationId, {
          messages: updatedMessages,
          title: conv?.title === '新对话' && updatedMessages.find(m => m.role === 'user')
            ? updatedMessages.find(m => m.role === 'user')!.content.substring(0, 20) + (updatedMessages.find(m => m.role === 'user')!.content.length > 20 ? '...' : '')
            : conv?.title,
        });
      },
      (errorMessage) => {
        const updatedMessages = useChatStore.getState().messages;
        setError(errorMessage);
        setLoading(false);
        setAbortController(null);
        updateConversation(conversationId, { messages: updatedMessages });
      },
      controller.signal,
    );
  }, [conversationId, addMessage, addMessageToConversation, updateLastMessage, setLoading, setError, setAbortController, updateConversation]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!conversationId || !currentConversation) return;

    const userMessage = addMessage({ role: 'user' as const, content, model: currentConversation.model });
    addMessageToConversation(conversationId, userMessage);

    await doSendMessage(
      [...messages, userMessage].map(message => ({
        role: message.role,
        content: message.content,
      })),
      currentConversation.model,
    );
  }, [conversationId, currentConversation, messages, addMessage, addMessageToConversation, doSendMessage]);

  const handleRegenerate = useCallback(async () => {
    if (!conversationId || !currentConversation || messages.length < 2) return;

    // Remove the last assistant message
    removeLastMessage();
    const msgsWithoutLast = useChatStore.getState().messages;
    updateConversation(conversationId, { messages: msgsWithoutLast });

    await doSendMessage(
      msgsWithoutLast.map(m => ({ role: m.role, content: m.content })),
      currentConversation.model,
    );
  }, [conversationId, currentConversation, messages, removeLastMessage, doSendMessage, updateConversation]);

  const handleStop = useCallback(() => {
    stopGeneration();
    // Save current state
    if (conversationId) {
      const updatedMessages = useChatStore.getState().messages;
      updateConversation(conversationId, { messages: updatedMessages });
    }
  }, [stopGeneration, conversationId, updateConversation]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        className="px-4 py-3 sm:px-6"
        style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--topbar-bg)' }}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <div className="mobile-titlebar sm:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-titlebar__menu"
              aria-label="打开菜单"
            >
              <svg className="h-[1.05rem] w-[1.05rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-[0.68rem] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                Chat Mode
              </div>
              <div className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                对话
              </div>
            </div>
            <div className="rounded-full px-2.5 py-1 text-[0.68rem]" style={{ background: 'var(--panel-muted)', color: 'var(--text-secondary)' }}>
              {currentConversation?.model || 'gpt-5.5'}
            </div>
          </div>

          <div className="hidden min-w-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <div className="mb-1 text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
                Chat Mode
              </div>
              <h2 className="text-xl font-semibold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
                更适合长聊与灵感整理
              </h2>
              <p className="mt-1 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                配色和留白已经调整成更柔和的阅读体验，手机上也更容易单手使用。
              </p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs" style={{ background: 'var(--panel-muted)', color: 'var(--text-secondary)' }}>
              <span>模型</span>
              <span style={{ color: 'var(--text-primary)' }}>{currentConversation?.model || 'gpt-5.5'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-7">
        <div className="max-w-4xl mx-auto">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onRegenerate={handleRegenerate}
          />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 text-sm animate-slide-up" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div
        className="px-3 pt-3 sm:px-6"
        style={{
          borderTop: '1px solid var(--border-default)',
          background: 'var(--topbar-bg)',
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
        }}
      >
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStop}
          placeholder="输入你的问题、灵感，或者让它帮你继续完善设定..."
          helperText="支持连续追问、改写和补充上下文。"
        />
      </div>
    </div>
  );
}
