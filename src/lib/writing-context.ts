import { Message, WritingContext } from '@/types';
import {
  MAX_REQUEST_CHARS,
  WARN_REQUEST_CHARS,
  MAX_MESSAGES_WITHOUT_MEMORY,
  calculateMessagesChars,
  truncateMessages,
} from '@/lib/utils';

// ========== 写作模式专用常量 ==========

/** 写作模式下，每次请求携带的最近对话轮数 */
export const MAX_RECENT_ROUNDS = 3;

/** 当对话轮数超过多少时触发自动压缩 */
export const COMPRESS_THRESHOLD = 6;

// ========== 核心函数 ==========

function section(title: string, content: string): string | null {
  const normalized = content.trim();
  if (!normalized) return null;
  return `【${title}】\n${normalized}`;
}

/**
 * 构建写入到 API 请求中的系统消息（小说记忆）。
 * 这是替代完整聊天历史的关键——不再把全部历史发过去，只发这个 + 最近几轮对话。
 */
export function buildWritingSystemMessages(writingContext: WritingContext): Message[] {
  const sections = [
    section('作品设定', writingContext.storyBible),
    section('人物与关系', writingContext.characterNotes),
    section('已写章节摘要', writingContext.chapterSummary),
    section('当前写作目标', writingContext.currentGoal),
  ].filter(Boolean);

  if (sections.length === 0) {
    return [];
  }

  return [
    {
      id: 'writing-context',
      role: 'system',
      content: [
        '你正在协助一部持续创作中的小说。',
        '请优先保持人物一致性、情节连续性、文风稳定性，不要随意吃掉设定。',
        '下面这些是本轮写作必须遵守的长期记忆，请在回答时持续参考：',
        sections.join('\n\n'),
        '',
        '---',
        '',
        '【自动记忆更新机制】',
        '每次回复结束后，请自动在末尾附加一个 memory-update JSON 块，',
        '用于更新和压缩小说记忆。这样后续对话就不需要携带完整历史了。',
        '',
        '格式如下：',
        '```memory-update',
        '{',
        '  "storyBible": "完整的作品设定（如果没变化就留空）",',
        '  "characterNotes": "完整的人物与关系（如果没变化就留空）",',
        '  "chapterSummary": "更新后的章节摘要（把新情节浓缩进去）",',
        '  "currentGoal": "下一步的写作目标"',
        '}',
        '```',
        '',
        '规则：',
        '1. 只输出有变化的字段（全量替换，不是增量）',
        '2. 如果所有字段都没变化，省略整个块',
        '3. chapterSummary 要简洁，几句话概括，不要照搬原文',
        '4. 你的主要回复内容正常写在 memory-update 块之前',
      ].join('\n\n'),
      timestamp: Date.now(),
    },
  ];
}

/**
 * 从 AI 回复中提取 memory-update JSON 块
 */
export function extractMemoryUpdateFromResponse(content: string): Partial<WritingContext> | null {
  const regex = /```memory-update\s*\n?([\s\S]*?)```/;
  const match = content.match(regex);

  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());
    const update: Partial<WritingContext> = {};

    if (typeof parsed.storyBible === 'string' && parsed.storyBible.trim()) {
      update.storyBible = parsed.storyBible.trim();
    }
    if (typeof parsed.characterNotes === 'string' && parsed.characterNotes.trim()) {
      update.characterNotes = parsed.characterNotes.trim();
    }
    if (typeof parsed.chapterSummary === 'string' && parsed.chapterSummary.trim()) {
      update.chapterSummary = parsed.chapterSummary.trim();
    }
    if (typeof parsed.currentGoal === 'string' && parsed.currentGoal.trim()) {
      update.currentGoal = parsed.currentGoal.trim();
    }

    return Object.keys(update).length > 0 ? update : null;
  } catch {
    return null;
  }
}

/**
 * 清理回复中的 memory-update 块
 */
export function stripMemoryUpdateFromResponse(content: string): string {
  return content.replace(/```memory-update\s*\n?[\s\S]*?```/g, '').trim();
}

/**
 * 构建用于触发 AI 压缩记忆的 system prompt
 */
export function buildCompressionPrompt(writingContext: WritingContext): string {
  const contextSummary = Object.entries(writingContext)
    .filter(([, value]) => value.trim())
    .map(([key]) => `- ${key}`)
    .join('\n');

  return [
    '上面是到目前为止的完整对话历史。',
    '请分析所有对话，然后做两件事：',
    '',
    '1. **压缩记忆**：更新小说记忆中的四个字段（设定、人物、摘要、目标），',
    '   把新出现的重要信息合并进去，去除已过时的内容。',
    '2. **输出格式**：只在回复末尾输出 memory-update JSON 块，不要额外内容。',
    '',
    currentConversationSummary(contextSummary),
    '',
    '```memory-update',
    '{',
    '  "storyBible": "更新后的完整设定",',
    '  "characterNotes": "更新后的完整人物关系",',
    '  "chapterSummary": "更新后的完整章节摘要",',
    '  "currentGoal": "更新后的当前目标"',
    '}',
    '```',
  ].join('\n');
}

/**
 * 构建"自动提取小说记忆"的 prompt
 */
export function buildMemoryExtractionPrompt(): string {
  return [
    '请分析上面的整个对话历史，提取出所有关于这部小说的关键信息，',
    '以 JSON 格式输出小说的"记忆"。只输出 JSON，不要任何额外内容。',
    '',
    '```memory-update',
    '{',
    '  "storyBible": "完整的世界观、背景规则、文风要求、核心设定等",',
    '  "characterNotes": "主要角色姓名、性格、关系、秘密、人物弧线等",',
    '  "chapterSummary": "到目前为止情节发展到了哪里，用简洁的摘要描述",',
    '  "currentGoal": "根据当前进度，建议下一步应该写什么"',
    '}',
    '```',
  ].join('\n');
}

function currentConversationSummary(contextSummary: string): string {
  if (!contextSummary) return '当前暂无已保存的记忆。';
  return `当前已保存的记忆字段：\n${contextSummary}`;
}

/**
 * 判断是否需要触发压缩
 */
export function shouldCompress(visibleMessageCount: number): boolean {
  return visibleMessageCount >= COMPRESS_THRESHOLD;
}

/**
 * 从对话中截取最近 N 轮对话
 * user + assistant 算一轮
 */
export function getRecentMessages(
  messages: { role: string; content: string }[],
  maxRounds: number = MAX_RECENT_ROUNDS,
): { role: string; content: string }[] {
  if (messages.length <= maxRounds * 2) {
    return messages;
  }
  return messages.slice(-(maxRounds * 2));
}

/**
 * 检查 writingContext 是否完全为空
 */
export function isWritingContextEmpty(context: WritingContext): boolean {
  return !context.storyBible.trim()
    && !context.characterNotes.trim()
    && !context.chapterSummary.trim()
    && !context.currentGoal.trim();
}

/**
 * 安全地构建请求消息：
 * 1. 如果有记忆 → 只传记忆 + 最近 MAX_RECENT_ROUNDS 轮
 * 2. 如果没有记忆但历史太短 → 传全部历史（让 AI 积累初始记忆）
 * 3. 如果没有记忆但历史太长 → 截断到最近 N 轮 + 加一条提示告诉 AI 历史被截断了
 *
 * 返回值：{ messages, wasTruncated, totalChars }
 */
export function buildSafeRequestMessages(
  allMessages: { role: string; content: string }[],
  writingContext: WritingContext,
): {
  messages: { role: string; content: string }[];
  wasTruncated: boolean;
  totalChars: number;
} {
  const hasMemory = !isWritingContextEmpty(writingContext);

  if (hasMemory) {
    // ✅ 有记忆：记忆 + 最近几轮对话
    const recentMessages = getRecentMessages(allMessages);
    const systemMessages = buildWritingSystemMessages(writingContext);
    const result = [
      ...systemMessages.map(({ role, content }) => ({ role, content })),
      ...recentMessages,
    ];
    return {
      messages: result,
      wasTruncated: allMessages.length > MAX_RECENT_ROUNDS * 2,
      totalChars: calculateMessagesChars(result),
    };
  }

  // ❌ 没有记忆
  const totalChars = calculateMessagesChars(allMessages);

  if (totalChars <= MAX_REQUEST_CHARS && allMessages.length <= MAX_MESSAGES_WITHOUT_MEMORY) {
    // 历史不长 → 全发，让 AI 积累初始记忆
    return {
      messages: allMessages,
      wasTruncated: false,
      totalChars,
    };
  }

  // ⛔ 历史太长 → 必须截断，否则 413
  let recentMessages: { role: string; content: string }[];

  if (allMessages.length > MAX_MESSAGES_WITHOUT_MEMORY) {
    // 超出消息数量上限，从尾部开始保留
    recentMessages = allMessages.slice(-MAX_MESSAGES_WITHOUT_MEMORY);
  } else {
    // 没超数量上限但超字符上限：使用通用截断函数
    recentMessages = truncateMessages(allMessages);
  }

  const truncatedHint = {
    role: 'system' as const,
    content: `【注意】由于对话历史过长，只保留了最近部分对话。如果缺少上下文，请基于已有信息回答。`,
  };

  return {
    messages: [truncatedHint, ...recentMessages],
    wasTruncated: true,
    totalChars: calculateMessagesChars([truncatedHint, ...recentMessages]),
  };
}

/**
 * 判断是否需要立即触发紧急压缩（历史太长且没有记忆）
 * 这种情况很容易 413，需要优先压缩
 */
export function needsEmergencyCompression(
  allMessages: { role: string; content: string }[],
  writingContext: WritingContext,
): boolean {
  if (!isWritingContextEmpty(writingContext)) return false;
  return calculateMessagesChars(allMessages) >= WARN_REQUEST_CHARS;
}
