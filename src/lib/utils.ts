import { v4 as uuidv4 } from 'uuid';

// ========== 消息截断相关常量 ==========

/**
 * 单次请求的最大字符数（保守估算）。
 * 上游 API 通常限制 4MB~10MB，但 message 太多也会 413。
 * 这里保守设 80000 字符（约 20000 token），远超正常使用。
 */
export const MAX_REQUEST_CHARS = 80000;

/**
 * 达到此字符数时发起"紧急压缩"。
 * 比 MAX_REQUEST_CHARS 小，提前预警。
 */
export const WARN_REQUEST_CHARS = 40000;

/**
 * 没有记忆时的硬上限：最多保留多少条消息（用户+助手）。
 * 超过此数量直接截断强制走记忆提取。
 */
export const MAX_MESSAGES_WITHOUT_MEMORY = 30;

// ========== 消息处理工具函数 ==========

export function generateId(): string {
  return uuidv4();
}

/**
 * 计算一组消息的总字符数
 */
export function calculateMessagesChars(messages: { role: string; content: string }[]): number {
  return messages.reduce((total, msg) => total + msg.content.length, 0);
}

/**
 * 通用消息截断函数：
 * 从尾部开始保留消息，直到接近字符上限。
 * 至少保留最近 2 条消息（1轮对话）。
 *
 * @param messages 原始消息数组
 * @param maxChars 最大字符数，默认 MAX_REQUEST_CHARS
 * @returns 截断后的消息数组
 */
export function truncateMessages(
  messages: { role: string; content: string }[],
  maxChars: number = MAX_REQUEST_CHARS,
): { role: string; content: string }[] {
  const totalChars = calculateMessagesChars(messages);
  if (totalChars <= maxChars) return messages;

  // 从尾部开始累加，直到接近上限
  const truncated: { role: string; content: string }[] = [];
  let chars = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (chars + msg.content.length > maxChars * 0.8) break;
    truncated.unshift(msg);
    chars += msg.content.length;
  }

  // 极端情况：单条消息就超大，至少保留最近一条
  if (truncated.length < 2) {
    return messages.slice(-2);
  }

  return truncated;
}

export function generateConversationTitle(messages: { role: string; content: string }[]): string {
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (!firstUserMessage) return '新对话';
  
  const content = firstUserMessage.content;
  if (content.length <= 20) return content;
  return content.substring(0, 20) + '...';
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
