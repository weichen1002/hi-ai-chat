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
  const { conversations, addMessageToConversation, updateConversation } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === conversationId);

  useEffect(() => {
    if (currentConversation) {
      setMessages(currentConversation.messages);
    } else {
      setMessages([]);
    }
  }, [conversationId, currentConversation, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const doSendMessage = useCallback(async (allMessages: { role: string; content: string }[], model: string) => {
    if (!conversationId) return;

    const assistantMessage = { role: 'assistant' as const, content: '', model };
    addMessage(assistantMessage);
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
        setError(errorMessage);
        setLoading(false);
        setAbortController(null);
      },
      controller.signal,
    );
  }, [conversationId, addMessage, updateLastMessage, setLoading, setError, setAbortController, updateConversation]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!conversationId || !currentConversation) return;

    const userMessage = { role: 'user' as const, content, model: currentConversation.model };
    addMessage(userMessage);
    addMessageToConversation(conversationId, userMessage);

    await doSendMessage([...messages, userMessage], currentConversation.model);
  }, [conversationId, currentConversation, messages, addMessage, addMessageToConversation, doSendMessage]);

  const handleRegenerate = useCallback(async () => {
    if (!conversationId || !currentConversation || messages.length < 2) return;

    // Remove the last assistant message
    removeLastMessage();
    const msgsWithoutLast = useChatStore.getState().messages;

    await doSendMessage(
      msgsWithoutLast.map(m => ({ role: m.role, content: m.content })),
      currentConversation.model,
    );
  }, [conversationId, currentConversation, messages, removeLastMessage, doSendMessage]);

  const handleStop = useCallback(() => {
    stopGeneration();
    // Save current state
    if (conversationId) {
      const updatedMessages = useChatStore.getState().messages;
      updateConversation(conversationId, { messages: updatedMessages });
    }
  }, [stopGeneration, conversationId, updateConversation]);

  return (
    <div className="flex flex-col h-full">
      {/* Model indicator bar */}
      <div
        className="flex items-center justify-center py-2 text-xs"
        style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
      >
        <span>模型: {currentConversation?.model || 'GPT-4'}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onRegenerate={handleRegenerate}
          />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-sm animate-slide-up" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border-default)' }}>
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} onStop={handleStop} />
      </div>
    </div>
  );
}
