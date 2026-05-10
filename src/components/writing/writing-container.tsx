'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useChatStore } from '@/stores/chat-store';
import { sendChatMessage } from '@/lib/api';
import { flushConversationSave } from '@/lib/storage';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { WritingPrompts } from './writing-prompts';
import { generateConversationTitle } from '@/lib/utils';
import { OutputMode } from '@/types';
import { useSmartScroll } from '@/hooks/use-smart-scroll';

interface WritingContainerProps {
  conversationId: string | null;
}

export function WritingContainer({ conversationId }: WritingContainerProps) {
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

  const currentConversation = conversations.find((conversation) => conversation.id === conversationId);
  const messages = useMemo(
    () => currentConversation?.messages.filter((message) => message.role !== 'system') || [],
    [currentConversation?.messages],
  );
  const panelWidthClass = 'max-w-3xl';
  const showPrompts = messages.length === 0;
  const scrollSignal = `${showPrompts ? 'prompts' : 'thread'}:${messages.length}:${messages[messages.length - 1]?.content.length || 0}`;
  const headlineIcon = '✍️';
  const headlineTitle = '写作模式';
  const headlineDescription = '像和编辑搭档一样，一边问、一边试、一边改，不用先想清楚全部方向。';
  const followupPlaceholder = '把你现在在想什么、卡在哪，或一小段草稿直接发给我...';
  const helperText = '可以很模糊地开口，比如“我想写点东西，但还没想好方向”。';

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
        const latestConversation = useAppStore.getState().conversations.find((conversation) => conversation.id === conversationId);
        const updatedMessages = latestConversation?.messages || [];

        updateConversation(conversationId, {
          title: latestConversation?.title === '新对话'
            ? `写作: ${generateConversationTitle(updatedMessages)}`
            : latestConversation?.title,
        });

        // 强制刷盘，确保数据立即保存到 IndexedDB
        await flushConversationSave();
      },
      async (errorMessage) => {
        const latestConversation = useAppStore.getState().conversations.find((conversation) => conversation.id === conversationId);
        const conversationMessages = latestConversation?.messages || [];
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
      [...messages, userMessage].map((message) => ({
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
    const messagesWithoutLast = (useAppStore.getState().conversations.find((conversation) => conversation.id === conversationId)?.messages || [])
      .filter((message) => message.role !== 'system');

    await doSendMessage(
      messagesWithoutLast.map((message) => ({ role: message.role, content: message.content })),
      currentConversation.model,
      currentConversation.temperature,
      currentConversation.outputMode,
      currentConversation.timeoutMs,
    );
  }, [conversationId, currentConversation, messages.length, removeLastMessageFromConversation, doSendMessage]);

  const handleStop = useCallback(() => {
    stopGeneration();
  }, [stopGeneration]);

  const handleNewWriting = useCallback(() => {
    setError(null);
    if (conversationId) {
      updateConversation(conversationId, {
        messages: [],
        title: '新对话',
      });
    }
  }, [conversationId, setError, updateConversation]);

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
          style={{
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--topbar-bg)',
          }}
        >
          <div className={`${panelWidthClass} mx-auto flex flex-col gap-3`}>
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
                  {headlineTitle}
                </div>
                <div className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  写作
                </div>
              </div>
              <div className="rounded-full px-2.5 py-1 text-[0.68rem]" style={{ background: 'var(--panel-muted)', color: 'var(--text-secondary)' }}>
                {currentConversation?.model || 'gpt-5.5'}
              </div>
            </div>

            <div className="hidden min-w-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
                  <span>{headlineIcon}</span>
                  <span>{headlineTitle}</span>
                </div>
                <h2 className="text-xl font-semibold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
                  更像和编辑搭档的写作工作台
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                  {headlineDescription}
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
        <div className={`${panelWidthClass} mx-auto`}>
          {showPrompts ? (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-[28px] border px-5 py-6 sm:px-7" style={{ background: 'var(--panel-surface)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-md)' }}>
                <div className="mb-3 text-4xl">{headlineIcon}</div>
                <h3 className="text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
                  先把你脑子里现在那一点点想法说出来
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 sm:text-[15px]" style={{ color: 'var(--text-secondary)' }}>
                  不用先决定题材、体裁或完整结构。你可以先要方向、要提问、要几个版本，再慢慢收敛。
                </p>
              </div>

              <WritingPrompts onSelect={(prompt) => { void handleSendMessage(prompt.prompt); }} />
            </div>
          ) : (
            <>
              <MessageList
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onRegenerate={handleRegenerate}
              />
              <div ref={messagesEndRef} />
            </>
          )}
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
        <div className="px-4 py-2 text-sm animate-slide-up" style={{ background: 'rgba(185, 28, 28, 0.08)', color: '#b91c1c' }}>
          <div className={`${panelWidthClass} mx-auto flex items-center gap-2`}>
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className={`${panelWidthClass} mx-auto`}>
          <div className="flex items-center justify-end mb-1">
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
            {!showPrompts && (
              <div className="mb-2 flex gap-2">
                <button
                  onClick={handleNewWriting}
                  className="rounded-full px-3 py-1.5 text-xs transition-colors"
                  style={{ background: 'var(--panel-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
                >
                  新写作
                </button>
              </div>
            )}
            <MessageInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onStop={handleStop}
              placeholder={followupPlaceholder}
              helperText={showPrompts ? helperText : '按 Enter 发送，Shift+Enter 换行。'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
