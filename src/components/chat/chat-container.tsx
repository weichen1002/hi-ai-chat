'use client';

import { useCallback, useMemo, useState } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useAppStore } from '@/stores/app-store';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { sendChatMessage } from '@/lib/api';
import { flushConversationSave } from '@/lib/storage';
import { OutputMode } from '@/types';
import { useSmartScroll } from '@/hooks/use-smart-scroll';

interface ChatContainerProps {
  conversationId: string | null;
}

export function ChatContainer({ conversationId }: ChatContainerProps) {
  const {
    isLoading, error,
    setLoading, setError,
    setAbortController, stopGeneration,
  } = useChatStore();
  const {
    conversations,
    addMessageToConversation,
    updateLastMessageInConversation,
    removeLastMessageFromConversation,
    updateConversation,
    setSidebarOpen,
  } = useAppStore();
  const [inputCollapsed, setInputCollapsed] = useState(false);

  const currentConversation = conversations.find(c => c.id === conversationId);
  const messages = useMemo(
    () => currentConversation?.messages.filter((message) => message.role !== 'system') || [],
    [currentConversation?.messages],
  );
  const scrollSignal = `${messages.length}:${messages[messages.length - 1]?.content.length || 0}`;

  const {
    scrollContainerRef,
    messagesEndRef,
    showJumpToLatest,
    handleScroll,
    scrollToBottom,
  } = useSmartScroll(scrollSignal, conversationId);

  const doSendMessage = useCallback(async (
    allMessages: { role: string; content: string }[],
    model: string,
    temperature: number | null,
    outputMode: OutputMode,
    timeoutMs: number,
  ) => {
    if (!conversationId) return;

    addMessageToConversation(conversationId, { role: 'assistant' as const, content: '', model });
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    setAbortController(controller);

    await sendChatMessage(
      allMessages,
      model,
      { temperature, outputMode, timeoutMs },
      (chunk) => updateLastMessageInConversation(conversationId, chunk),
      async () => {
        setLoading(false);
        setAbortController(null);
        const conv = useAppStore.getState().conversations.find(c => c.id === conversationId);
        const updatedMessages = conv?.messages || [];
        const firstUserMessage = updatedMessages.find((message) => message.role === 'user');

        updateConversation(conversationId, {
          title: conv?.title === '新对话' && firstUserMessage
            ? firstUserMessage.content.substring(0, 20) + (firstUserMessage.content.length > 20 ? '...' : '')
            : conv?.title,
        });

        // 强制刷盘，确保数据立即保存到 IndexedDB
        await flushConversationSave();
      },
      async (errorMessage) => {
        const conv = useAppStore.getState().conversations.find(c => c.id === conversationId);
        const conversationMessages = conv?.messages || [];
        const lastMessage = conversationMessages[conversationMessages.length - 1];

        if (lastMessage?.role === 'assistant' && lastMessage.content === '') {
          removeLastMessageFromConversation(conversationId);
        }

        setError(errorMessage);
        setLoading(false);
        setAbortController(null);

        // 出错时也强制刷盘，尽可能保留已有内容
        await flushConversationSave();
      },
      controller.signal,
    );
  }, [conversationId, addMessageToConversation, updateLastMessageInConversation, removeLastMessageFromConversation, setLoading, setError, setAbortController, updateConversation]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!conversationId || !currentConversation) return;

    const userMessage = addMessageToConversation(conversationId, {
      role: 'user' as const,
      content,
      model: currentConversation.model,
    });

    await doSendMessage(
      [...messages, userMessage].map(message => ({
        role: message.role,
        content: message.content,
      })),
      currentConversation.model,
      currentConversation.temperature,
      currentConversation.outputMode,
      currentConversation.timeoutMs,
    );
  }, [conversationId, currentConversation, messages, addMessageToConversation, doSendMessage]);

  const handleRegenerate = useCallback(async () => {
    if (!conversationId || !currentConversation || messages.length < 2) return;

    removeLastMessageFromConversation(conversationId);
    const msgsWithoutLast = (useAppStore.getState().conversations.find(c => c.id === conversationId)?.messages || [])
      .filter((message) => message.role !== 'system');

    await doSendMessage(
      msgsWithoutLast.map(m => ({ role: m.role, content: m.content })),
      currentConversation.model,
      currentConversation.temperature,
      currentConversation.outputMode,
      currentConversation.timeoutMs,
    );
  }, [conversationId, currentConversation, messages, removeLastMessageFromConversation, doSendMessage]);

  const handleStop = useCallback(() => {
    stopGeneration();
  }, [stopGeneration]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* 顶部区域 — 折叠时隐藏 */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: inputCollapsed ? '0px' : '200px',
          opacity: inputCollapsed ? 0 : 1,
        }}
      >
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
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-7"
      >
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

      {showJumpToLatest && messages.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 right-5 z-20 sm:right-8">
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="pointer-events-auto flex items-center justify-center w-9 h-9 rounded-full shadow-lg transition-all hover:opacity-90 hover:scale-105 active:scale-95"
            style={{
              background: 'var(--panel-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-6-6m6 6l6-6" />
            </svg>
          </button>
        </div>
      )}

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

      {/* 底部输入区域 — 折叠/展开控制 */}
      <div
        className="px-3 pt-1.5 sm:px-6 transition-all duration-300 ease-in-out"
        style={{
          borderTop: inputCollapsed ? 'none' : '1px solid var(--border-default)',
          background: 'var(--topbar-bg)',
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className={`flex items-center justify-end mb-1 transition-opacity duration-300 ${inputCollapsed ? 'opacity-100' : 'opacity-100'}`}>
            <button
              onClick={() => setInputCollapsed(!inputCollapsed)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-all hover:opacity-80"
              style={{ color: 'var(--text-muted)', opacity: 0.4 }}
              title={inputCollapsed ? '展开输入区域' : '折叠输入区域'}
            >
              <svg
                className="w-3 h-3 transition-transform duration-300"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ transform: inputCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              {inputCollapsed ? '展开' : '折叠'}
            </button>
          </div>
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: inputCollapsed ? '0px' : '400px',
              opacity: inputCollapsed ? 0 : 1,
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
      </div>
    </div>
  );
}
