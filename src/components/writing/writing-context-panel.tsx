'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { WritingContext } from '@/types';

interface WritingContextPanelProps {
  conversationId: string;
  writingContext: WritingContext;
}

export function WritingContextPanel({
  conversationId,
  writingContext,
}: WritingContextPanelProps) {
  const { updateConversation } = useAppStore();
  const [expanded, setExpanded] = useState(false);

  const filledCount = useMemo(() => {
    return Object.values(writingContext).filter((value) => value.trim().length > 0).length;
  }, [writingContext]);

  const patchWritingContext = (patch: Partial<WritingContext>) => {
    updateConversation(conversationId, {
      writingContext: {
        ...writingContext,
        ...patch,
      },
    });
  };

  const fields: Array<{
    key: keyof WritingContext;
    label: string;
    placeholder: string;
    rows: number;
  }> = [
    {
      key: 'storyBible',
      label: '作品设定',
      placeholder: '世界观、背景规则、文风要求、禁区设定。这里放长期有效的“作品圣经”。',
      rows: 4,
    },
    {
      key: 'characterNotes',
      label: '人物与关系',
      placeholder: '主角性格、说话方式、人物关系、关键秘密、人物弧线。',
      rows: 4,
    },
    {
      key: 'chapterSummary',
      label: '已写章节摘要',
      placeholder: '用摘要写到目前为止发生了什么，不要整章原文照搬。',
      rows: 4,
    },
    {
      key: 'currentGoal',
      label: '当前章节目标',
      placeholder: '这次要写哪一段，要推进什么冲突，要保留什么伏笔。',
      rows: 3,
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
        <div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            小说记忆
          </div>
          <div className="mt-1 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
            主流小说工具通常会把长期设定、人物卡、章节摘要、当前目标分开管理，而不是只靠聊天历史硬扛。
          </div>
        </div>
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
          {expanded ? '收起' : `展开 ${filledCount}/4`}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {fields.map((field) => (
            <label key={field.key} className="block">
              <div className="mb-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {field.label}
              </div>
              <textarea
                value={writingContext[field.key]}
                onChange={(event) => patchWritingContext({ [field.key]: event.target.value })}
                placeholder={field.placeholder}
                rows={field.rows}
                className="w-full resize-y rounded-2xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
