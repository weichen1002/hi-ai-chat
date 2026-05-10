import { Message, WritingContext } from '@/types';

function section(title: string, content: string): string | null {
  const normalized = content.trim();
  if (!normalized) return null;
  return `【${title}】\n${normalized}`;
}

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
      ].join('\n\n'),
      timestamp: Date.now(),
    },
  ];
}
