'use client';

import { useMemo, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useChatStore } from '@/stores/chat-store';
import { WritingContext } from '@/types';
import { sendChatMessage } from '@/lib/api';
import { flushConversationSave } from '@/lib/storage';
import {
  buildWritingSystemMessages,
  buildMemoryExtractionPrompt,
  extractMemoryUpdateFromResponse,
} from '@/lib/writing-context';

interface WritingContextPanelProps {
  conversationId: string;
  writingContext: WritingContext;
  isCompressing?: boolean;
}

export function WritingContextPanel({
  conversationId,
  writingContext,
  isCompressing = false,
}: WritingContextPanelProps) {
  const { updateConversation, conversations } = useAppStore();
  const { setLoading, setError } = useChatStore();
  const [expanded, setExpanded] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const filledCount = useMemo(() => {
    return Object.values(writingContext).filter((value) => value.trim().length > 0).length;
  }, [writingContext]);

  const hasContent = filledCount > 0;
  const currentConversation = conversations.find((c) => c.id === conversationId);
  const conversationMessages = currentConversation?.messages || [];
  const visibleMessages = conversationMessages.filter((m) => m.role !== 'system');
  const hasConversationHistory = visibleMessages.length > 0;

  const patchWritingContext = useCallback((patch: Partial<WritingContext>) => {
    updateConversation(conversationId, {
      writingContext: {
        ...writingContext,
        ...patch,
      },
    });
  }, [conversationId, writingContext, updateConversation]);

  /** 一键清空 */
  const handleClear = useCallback(() => {
    patchWritingContext({
      storyBible: '',
      characterNotes: '',
      chapterSummary: '',
      currentGoal: '',
    });
  }, [patchWritingContext]);

  /** 一键自动提取 */
  const handleAutoExtract = useCallback(async () => {
    if (!currentConversation || visibleMessages.length === 0) return;

    setIsExtracting(true);
    setLoading(true);

    let accumulatedContent = '';

    try {
      const systemMessages = buildWritingSystemMessages(writingContext);
      const extractionPrompt = buildMemoryExtractionPrompt();

      const requestMessages = [
        ...systemMessages,
        ...visibleMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: extractionPrompt },
      ];

      await sendChatMessage(
        requestMessages,
        currentConversation.model,
        { temperature: null, outputMode: 'default', timeoutMs: 60000 },
        (chunk) => { accumulatedContent += chunk; },
        async () => {
          setIsExtracting(false);
          setLoading(false);

          const memoryUpdate = extractMemoryUpdateFromResponse(accumulatedContent);
          if (memoryUpdate) {
            updateConversation(conversationId, {
              writingContext: {
                ...writingContext,
                ...memoryUpdate,
              },
            });
          } else {
            const cleaned = accumulatedContent.replace(/```[\s\S]*?```/g, '').trim();
            if (cleaned.length > 10) {
              patchWritingContext({ chapterSummary: cleaned });
            }
          }

          await flushConversationSave();
        },
        async (errorMessage) => {
          setIsExtracting(false);
          setLoading(false);
          setError(`自动提取失败: ${errorMessage}`);
        },
        undefined,
      );
    } catch {
      setIsExtracting(false);
      setLoading(false);
      setError('自动提取出错，请稍后重试');
    }
  }, [currentConversation, visibleMessages, writingContext, conversationId, setLoading, setError, patchWritingContext, updateConversation]);

  const fields: Array<{
    key: keyof WritingContext;
    label: string;
    placeholder: string;
    rows: number;
  }> = [
    {
      key: 'storyBible',
      label: '作品设定',
      placeholder: '留空让 AI 自动管理',
      rows: 3,
    },
    {
      key: 'characterNotes',
      label: '人物与关系',
      placeholder: '留空让 AI 自动管理',
      rows: 3,
    },
    {
      key: 'chapterSummary',
      label: '已写章节摘要',
      placeholder: '留空让 AI 自动管理',
      rows: 3,
    },
    {
      key: 'currentGoal',
      label: '当前章节目标',
      placeholder: '留空让 AI 自动管理',
      rows: 2,
    },
  ];

  return (
    <div
      className="rounded-[24px] border px-4 py-4 sm:px-5"
      style={{
        background: 'var(--panel-surface)',
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              小说记忆
            </div>
            {hasContent && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'rgb(52, 211, 153)' }}
              >
                {filledCount}/4
              </span>
            )}
            {(isExtracting || isCompressing) && (
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" />
                {isCompressing ? '压缩中...' : '提取中...'}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
            {hasContent
              ? 'AI 自动管理，无需手动填写。每次只传记忆+最近对话，大幅节省 token。'
              : 'AI 会从对话中自动提取记忆并压缩上下文，你只管聊。'}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasConversationHistory && !hasContent && (
            <button
              type="button"
              onClick={handleAutoExtract}
              disabled={isExtracting}
              className="rounded-full px-2.5 py-1.5 text-xs transition-all disabled:opacity-40"
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                color: 'rgb(99, 102, 241)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
              title="让 AI 分析整个对话，自动提取设定、人物、摘要和目标"
            >
              {isExtracting ? '提取中...' : '自动提取'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="rounded-full px-3 py-1.5 text-xs transition-all"
            style={{
              background: 'var(--panel-muted)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
            }}
          >
            {expanded ? '收起' : hasContent ? `查看 ${filledCount}/4` : '查看'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          {fields.map((field) => (
            <label key={field.key} className="block">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {field.label}
                </span>
                {writingContext[field.key].trim() && (
                  <span
                    className="text-[10px] cursor-pointer hover:opacity-70"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => patchWritingContext({ [field.key]: '' })}
                  >
                    清空
                  </span>
                )}
              </div>
              <textarea
                value={writingContext[field.key]}
                onChange={(event) => patchWritingContext({ [field.key]: event.target.value })}
                placeholder={field.placeholder}
                rows={field.rows}
                className="w-full resize-y rounded-2xl px-3 py-2.5 text-sm outline-none transition-shadow focus:shadow-sm"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </label>
          ))}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              AI 自动维护，你也可以手动微调
            </span>
            {hasContent && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] px-2 py-1 rounded transition-all hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                清空所有
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
