import { Model } from '@/types';

export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    description: '轻量快速，适合日常对话',
    maxTokens: 128000,
    isAvailable: true,
  },
  {
    id: 'gpt-5',
    name: 'GPT-5',
    description: '强大均衡，适合大多数任务',
    maxTokens: 256000,
    isAvailable: true,
  },
  {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    description: '旗舰级模型，复杂推理首选',
    maxTokens: 1000000,
    isAvailable: true,
  },
  {
    id: 'gpt-5.5',
    name: 'GPT-5.5',
    description: '最新最强，顶级智能体验',
    maxTokens: 1000000,
    isAvailable: true,
  },
];

export async function sendChatMessage(
  messages: { role: string; content: string }[],
  model: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal
) {
  try {
    // 通过本地 API 路由代理请求，避免 CORS 问题和暴露 API Key
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `API请求失败: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.content || parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      onComplete();
      return;
    }
    onError(error instanceof Error ? error.message : '发送消息失败');
  }
}

export function getModels(): Model[] {
  return AVAILABLE_MODELS;
}
