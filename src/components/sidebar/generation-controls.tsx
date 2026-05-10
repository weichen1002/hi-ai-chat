'use client';

import { useAppStore } from '@/stores/app-store';
import { getDefaultOutputMode, getDefaultTimeoutMs, OUTPUT_MODE_OPTIONS } from '@/lib/chat-config';
import { OutputMode } from '@/types';

const TIMEOUT_OPTIONS = [
  { value: 60000, label: '60s' },
  { value: 120000, label: '120s' },
  { value: 180000, label: '180s' },
  { value: 300000, label: '300s' },
  { value: 600000, label: '600s' },
  { value: 900000, label: '900s' },
];

export function GenerationControls() {
  const { conversations, currentConversationId, updateConversation } = useAppStore();
  const currentConversation = conversations.find((conversation) => conversation.id === currentConversationId);

  const selectedOutputMode = currentConversation?.outputMode || 'default';
  const temperature = currentConversation?.temperature;
  const timeoutMs = currentConversation?.timeoutMs ?? 120000;
  const isDefaultTemperature = temperature == null;
  const defaultOutputMode = getDefaultOutputMode();

  const currentModeMeta = OUTPUT_MODE_OPTIONS.find((option) => option.id === selectedOutputMode);

  if (!currentConversationId || !currentConversation) {
    return null;
  }

  const defaultTimeoutMs = getDefaultTimeoutMs(currentConversation.mode);
  const isDefaultOutputMode = selectedOutputMode === defaultOutputMode;
  const isDefaultTimeout = timeoutMs === defaultTimeoutMs;

  const patchConversation = (updates: {
    temperature?: number | null;
    outputMode?: OutputMode;
    timeoutMs?: number;
  }) => {
    updateConversation(currentConversationId, updates);
  };

  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: 'var(--panel-surface)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div className="mb-3">
        <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>生成设置</div>
        <div className="mt-1 text-[11px] leading-5" style={{ color: 'var(--text-muted)' }}>
          当前会话独立生效，适合为聊天和写作分别调参数。
        </div>
      </div>

      <div className="space-y-3">
        <label className="block">
          <div className="mb-1.5 flex items-center justify-between text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <span>Temperature</span>
            <span className="tabular-nums">{isDefaultTemperature ? '模型默认' : temperature.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.1"
            value={temperature ?? 0.7}
            onChange={(event) => patchConversation({ temperature: Number(event.target.value) })}
            className="w-full accent-[var(--accent-from)]"
          />
          <div className="mt-1 flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>更稳</span>
            <button
              type="button"
              onClick={() => patchConversation({ temperature: null })}
              className="rounded-full px-2 py-0.5"
              style={{
                background: isDefaultTemperature ? 'var(--panel-muted)' : 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              恢复默认
            </button>
            <span>更发散</span>
          </div>
        </label>

        <label className="block">
          <div className="mb-1.5 flex items-center justify-between text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <span>输出模式</span>
            <button
              type="button"
              onClick={() => patchConversation({ outputMode: defaultOutputMode })}
              className="rounded-full px-2 py-0.5"
              style={{
                background: isDefaultOutputMode ? 'var(--panel-muted)' : 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              恢复默认
            </button>
          </div>
          <select
            value={selectedOutputMode}
            onChange={(event) => patchConversation({ outputMode: event.target.value as OutputMode })}
            className="w-full rounded-xl px-3 py-2 text-xs outline-none"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            {OUTPUT_MODE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="mt-1 text-[10px] leading-4" style={{ color: 'var(--text-muted)' }}>
            {currentModeMeta?.description}
          </div>
        </label>

        <label className="block">
          <div className="mb-1.5 flex items-center justify-between text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <span>超时控制</span>
            <button
              type="button"
              onClick={() => patchConversation({ timeoutMs: defaultTimeoutMs })}
              className="rounded-full px-2 py-0.5"
              style={{
                background: isDefaultTimeout ? 'var(--panel-muted)' : 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              恢复默认
            </button>
          </div>
          <select
            value={timeoutMs}
            onChange={(event) => patchConversation({ timeoutMs: Number(event.target.value) })}
            className="w-full rounded-xl px-3 py-2 text-xs outline-none"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            {TIMEOUT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="mt-1 text-[10px] leading-4" style={{ color: 'var(--text-muted)' }}>
            超时后会终止上游请求，避免长时间挂住。
          </div>
        </label>
      </div>
    </div>
  );
}
