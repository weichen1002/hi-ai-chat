'use client';

import { WritingPrompt } from '@/types';

const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'novel',
    title: '小说创作',
    description: '创作一个完整的故事，包含人物、情节和结局',
    icon: '📖',
    prompt: '你是一位专业的小说作家。请根据以下主题创作一个完整的小说故事：\n\n主题：{topic}\n\n要求：\n1. 包含引人入胜的开头\n2. 塑造鲜明的人物形象\n3. 构建曲折的情节\n4. 设计令人满意的结局\n5. 字数不少于1000字',
    category: 'fiction',
  },
  {
    id: 'short-story',
    title: '短篇故事',
    description: '创作一个精炼的短篇故事',
    icon: '📝',
    prompt: '你是一位擅长短篇故事的作家。请根据以下主题创作一个短篇故事：\n\n主题：{topic}\n\n要求：\n1. 故事简洁有力\n2. 情节紧凑\n3. 结尾有深意\n4. 字数在500-800字之间',
    category: 'fiction',
  },
  {
    id: 'poem',
    title: '诗歌创作',
    description: '创作一首优美的诗歌',
    icon: '🎭',
    prompt: '你是一位才华横溢的诗人。请根据以下主题创作一首诗歌：\n\n主题：{topic}\n\n要求：\n1. 语言优美凝练\n2. 意境深远\n3. 情感真挚\n4. 形式自由或遵循特定诗体',
    category: 'poetry',
  },
  {
    id: 'article',
    title: '文章写作',
    description: '撰写一篇结构完整的文章',
    icon: '📰',
    prompt: '你是一位资深的文章写作者。请根据以下主题撰写一篇文章：\n\n主题：{topic}\n\n要求：\n1. 结构清晰，包含引言、正文和结论\n2. 论点明确，论据充分\n3. 语言流畅，逻辑严密\n4. 字数在800-1200字之间',
    category: 'non-fiction',
  },
  {
    id: 'script',
    title: '剧本创作',
    description: '创作一个剧本或对话脚本',
    icon: '🎬',
    prompt: '你是一位专业的剧本作家。请根据以下主题创作一个剧本：\n\n主题：{topic}\n\n要求：\n1. 包含场景描述\n2. 人物对话生动\n3. 情节发展合理\n4. 适合舞台或影视表演',
    category: 'script',
  },
];

interface WritingPromptsProps {
  onSelect: (prompt: WritingPrompt) => void;
  selectedId?: string;
}

export function WritingPrompts({ onSelect, selectedId }: WritingPromptsProps) {
  const gradients = [
    'linear-gradient(135deg, #7c3aed20, #2563eb20)',
    'linear-gradient(135deg, #ec489920, #f9731620)',
    'linear-gradient(135deg, #10b98120, #06b6d420)',
    'linear-gradient(135deg, #f59e0b20, #ef444420)',
    'linear-gradient(135deg, #8b5cf620, #ec489920)',
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {WRITING_PROMPTS.map((prompt, index) => {
        const isSelected = selectedId === prompt.id;
        return (
          <button
            key={prompt.id}
            className="text-left p-4 rounded-xl transition-all"
            style={{
              background: isSelected ? gradients[index] : 'var(--bg-tertiary)',
              border: isSelected ? '1px solid var(--border-active)' : '1px solid var(--border-default)',
              boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
            }}
            onClick={() => onSelect(prompt)}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <span className="text-2xl block mb-2">{prompt.icon}</span>
            <h3 className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{prompt.title}</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{prompt.description}</p>
          </button>
        );
      })}
    </div>
  );
}
