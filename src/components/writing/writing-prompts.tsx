'use client';

import { WritingPrompt } from '@/types';

const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'find-direction',
    title: '帮我找方向',
    description: '从一个模糊想法里拆出几个可继续追问的写作方向',
    icon: '🧭',
    prompt: '我还没想清楚要写什么。请先根据常见创作目标，给我 5 个不同方向，并说明每个方向适合什么场景、优缺点，以及我接下来该怎么继续提问。',
    category: 'strategy',
  },
  {
    id: 'build-outline',
    title: '先搭骨架',
    description: '把零散想法整理成结构、大纲或可执行清单',
    icon: '🗂️',
    prompt: '我有一些零散想法，但还没有结构。请先像编辑一样向我追问 3 到 5 个关键问题，然后基于我的回答帮我整理成一个清晰的大纲。',
    category: 'structure',
  },
  {
    id: 'rewrite-tone',
    title: '换个语气写',
    description: '同一段内容试几个不同风格，便于比较和调试',
    icon: '🎭',
    prompt: '我想反复试不同写法。等我贴出内容后，请给我至少 3 个明显不同的版本，并解释每个版本的语气、节奏和适用场景。',
    category: 'rewrite',
  },
  {
    id: 'continue-writing',
    title: '边写边试',
    description: '适合续写、补段落、改句子，边走边调',
    icon: '✍️',
    prompt: '接下来我会一段一段地给你内容。你先不要一次性写很长，而是按“先理解目标，再给短版本，再根据我反馈迭代”的方式和我一起写。',
    category: 'iteration',
  },
  {
    id: 'compare-options',
    title: '帮我做取舍',
    description: '当你有多个版本、多条线索或多个方向时帮你比较',
    icon: '⚖️',
    prompt: '我可能会给你几个不同版本或不同思路。请不要直接替我拍板，而是先帮我逐项比较它们的优劣、风险和适用场景，再给出建议。',
    category: 'decision',
  },
];

interface WritingPromptsProps {
  onSelect: (prompt: WritingPrompt) => void;
}

export function WritingPrompts({ onSelect }: WritingPromptsProps) {
  const gradients = [
    'linear-gradient(135deg, rgba(45, 98, 86, 0.16), rgba(177, 221, 209, 0.28))',
    'linear-gradient(135deg, rgba(52, 83, 133, 0.14), rgba(171, 199, 236, 0.24))',
    'linear-gradient(135deg, rgba(104, 68, 126, 0.14), rgba(215, 191, 228, 0.24))',
    'linear-gradient(135deg, rgba(124, 91, 45, 0.14), rgba(233, 210, 167, 0.24))',
    'linear-gradient(135deg, rgba(91, 91, 91, 0.12), rgba(221, 221, 221, 0.2))',
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {WRITING_PROMPTS.map((prompt, index) => {
        return (
          <button
            key={prompt.id}
            className="text-left p-4 rounded-2xl transition-all"
            style={{
              background: gradients[index % gradients.length],
              border: '1px solid var(--border-default)',
            }}
            onClick={() => onSelect(prompt)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span className="text-2xl block mb-2">{prompt.icon}</span>
            <h3 className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{prompt.title}</h3>
            <p className="text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>{prompt.description}</p>
          </button>
        );
      })}
    </div>
  );
}
