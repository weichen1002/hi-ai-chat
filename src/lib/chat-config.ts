import { AppMode, OutputMode } from '@/types';

export const OUTPUT_MODE_OPTIONS: Array<{
  id: OutputMode;
  label: string;
  description: string;
}> = [
  { id: 'default', label: '按模型默认', description: '保持你之前的默认行为，不额外注入风格指令' },
  { id: 'balanced', label: '标准', description: '默认输出，兼顾完整和自然' },
  { id: 'concise', label: '精简', description: '更短、更直接，减少铺陈' },
  { id: 'structured', label: '结构化', description: '更偏分点、标题和清单' },
  { id: 'creative', label: '创意', description: '更发散，适合灵感和写作' },
];

export function getDefaultTemperature(): number | null {
  return null;
}

export function getDefaultOutputMode(): OutputMode {
  return 'default';
}

export function getDefaultTimeoutMs(mode: 'chat' | 'writing'): number {
  return mode === 'writing' ? 180000 : 120000;
}

export function clampTemperature(value: number): number {
  return Math.min(1.5, Math.max(0, Number.isFinite(value) ? value : 0.7));
}

export function normalizeTemperature(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return clampTemperature(value);
}

export function normalizeTimeoutMs(value: number, mode: AppMode): number {
  const fallback = getDefaultTimeoutMs(mode);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(300000, Math.max(30000, Math.round(value)));
}

export function isOutputMode(value: string): value is OutputMode {
  return OUTPUT_MODE_OPTIONS.some((option) => option.id === value);
}

export function getOutputModeInstruction(outputMode: OutputMode): string | null {
  switch (outputMode) {
    case 'default':
      return null;
    case 'concise':
      return '请尽量简洁，优先给结论，避免冗长铺陈。';
    case 'structured':
      return '请优先使用清晰结构输出；在合适时使用标题、分点或编号，让结果更易浏览。';
    case 'creative':
      return '请适度提高创意和发散度，在保持可用性的前提下多给一些有启发性的表达或方案。';
    default:
      return null;
  }
}
