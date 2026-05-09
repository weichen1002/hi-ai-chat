'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useChatStore } from '@/stores/chat-store';
import { sendChatMessage } from '@/lib/api';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { WritingPrompts } from './writing-prompts';
import { WritingPrompt } from '@/types';

interface WritingContainerProps {
  conversationId: string | null;
}

export function WritingContainer({ conversationId }: WritingContainerProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<WritingPrompt | null>(null);
  const [topic, setTopic] = useState('');
  const [showPrompts, setShowPrompts] = useState(true);
  const {
    messages, isLoading, error,
    addMessage, updateLastMessage, removeLastMessage,
    setLoading, setError, setMessages,
    setAbortController, stopGeneration,
  } = useChatStore();
  const { conversations, addMessageToConversation, updateConversation } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === conversationId);

  // 从 conversation 加载消息
  useEffect(() => {
    if (currentConversation) {
      const filteredMessages = currentConversation.messages.filter(m => m.role !== 'system');
      setMessages(filteredMessages);
      // 如果有消息，隐藏提示词选择
      if (filteredMessages.length > 0) {
        setShowPrompts(false);
      }
    } else {
      setMessages([]);
      setShowPrompts(true);
    }
  }, [conversationId, currentConversation, setMessages]);

  // 自动滚动
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
          title: conv?.title === '新对话'
            ? `写作: ${topic.substring(0, 15)}${topic.length > 15 ? '...' : ''}`
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
  }, [conversationId, topic, addMessage, updateLastMessage, setLoading, setError, setAbortController, updateConversation]);

  const handleStartWriting = useCallback(async () => {
    if (!conversationId || !currentConversation || !selectedPrompt || !topic.trim()) return;

    const systemContent = selectedPrompt.prompt.replace('{topic}', topic);
    const userContent = `请帮我写一篇关于"${topic}"的${selectedPrompt.title}`;

    const userMessage = { role: 'user' as const, content: userContent, model: currentConversation.model };
    addMessage(userMessage);
    addMessageToConversation(conversationId, userMessage);

    setShowPrompts(false);

    await doSendMessage(
      [{ role: 'system', content: systemContent }, ...messages, userMessage],
      currentConversation.model,
    );
  }, [conversationId, currentConversation, selectedPrompt, topic, messages, addMessage, addMessageToConversation, doSendMessage]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!conversationId || !currentConversation) return;

    const userMessage = { role: 'user' as const, content, model: currentConversation.model };
    addMessage(userMessage);
    addMessageToConversation(conversationId, userMessage);

    await doSendMessage([...messages, userMessage], currentConversation.model);
  }, [conversationId, currentConversation, messages, addMessage, addMessageToConversation, doSendMessage]);

  const handleRegenerate = useCallback(async () => {
    if (!conversationId || !currentConversation || messages.length < 2) return;

    removeLastMessage();
    const msgsWithoutLast = useChatStore.getState().messages;

    await doSendMessage(
      msgsWithoutLast.map(m => ({ role: m.role, content: m.content })),
      currentConversation.model,
    );
  }, [conversationId, currentConversation, messages, removeLastMessage, doSendMessage]);

  const handleStop = useCallback(() => {
    stopGeneration();
    if (conversationId) {
      const updatedMessages = useChatStore.getState().messages;
      updateConversation(conversationId, { messages: updatedMessages });
    }
  }, [stopGeneration, conversationId, updateConversation]);

  const handleNewWriting = useCallback(() => {
    setMessages([]);
    setSelectedPrompt(null);
    setTopic('');
    setShowPrompts(true);
  }, [setMessages]);

  return (
    <div className="flex flex-col h-full">
      {/* Model indicator bar */}
      <div
        className="flex items-center justify-center py-2 text-xs"
        style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
      >
        <span>模型: {currentConversation?.model || 'GPT-5.4'}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {showPrompts ? (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <span className="text-4xl block mb-3">✍️</span>
                <h2 className="text-2xl font-bold gradient-text mb-2">写作专家模式</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>选择写作类型，输入主题，开始创作</p>
              </div>

              <WritingPrompts onSelect={setSelectedPrompt} selectedId={selectedPrompt?.id} />

              {selectedPrompt && (
                <div className="space-y-4 animate-slide-up">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>写作主题</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder={`请输入${selectedPrompt.title}的主题`}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = 'var(--shadow-glow)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && topic.trim()) handleStartWriting(); }}
                    />
                  </div>
                  <button
                    onClick={handleStartWriting}
                    disabled={!topic.trim() || isLoading}
                    className="btn-gradient w-full py-3 rounded-xl text-sm font-medium"
                  >
                    {isLoading ? '生成中...' : '开始写作'}
                  </button>
                </div>
              )}
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

      {/* Input area */}
      {!showPrompts && (
        <div className="p-4" style={{ borderTop: '1px solid var(--border-default)' }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleNewWriting}
                className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
              >
                新写作
              </button>
            </div>
            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} onStop={handleStop} />
          </div>
        </div>
      )}
    </div>
  );
}