import { NextRequest, NextResponse } from 'next/server';
import { AVAILABLE_MODELS } from '@/lib/api';
import {
  getDefaultOutputMode,
  getOutputModeInstruction,
  isOutputMode,
  normalizeTemperature,
  normalizeTimeoutMs,
} from '@/lib/chat-config';
import { logServerEvent } from '@/lib/server-log';
import { OutputMode } from '@/types';

const API_ENDPOINT = process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT || '';
const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
const ALLOWED_MODELS = new Set(AVAILABLE_MODELS.map((model) => model.id));

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function createErrorResponse(message: string, status: number, requestId: string) {
  return NextResponse.json(
    {
      error: {
        code: status,
        message,
        requestId,
      },
    },
    { status },
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;

  const message = value as Record<string, unknown>;
  return (
    (message.role === 'user' || message.role === 'assistant' || message.role === 'system') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0
  );
}

function buildMessages(messages: ChatMessage[], outputMode: OutputMode): ChatMessage[] {
  const instruction = getOutputModeInstruction(outputMode);
  if (!instruction) {
    return messages;
  }

  return [
    {
      role: 'system',
      content: instruction,
    },
    ...messages,
  ];
}

function getChatEventLevel(event: string): 'info' | 'warn' | 'error' {
  if (event === 'upstream_error' || event === 'request_aborted') {
    return 'warn';
  }

  if (event === 'stream_error' || event === 'request_failed') {
    return 'error';
  }

  return 'info';
}

function logChatEvent(requestId: string, event: string, extra: Record<string, unknown>) {
  logServerEvent({
    category: 'chat_api',
    event,
    level: getChatEventLevel(event),
    data: {
      requestId,
      ...extra,
    },
  });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const body = await request.json();
    const model = typeof body?.model === 'string' ? body.model : '';
    const outputMode = isOutputMode(body?.outputMode) ? body.outputMode : getDefaultOutputMode();
    const temperature = normalizeTemperature(
      typeof body?.temperature === 'number' ? body.temperature : null,
    );
    const timeoutMs = normalizeTimeoutMs(Number(body?.timeoutMs), 'chat');
    const rawMessages: unknown[] = Array.isArray(body?.messages) ? body.messages : [];
    const messages: ChatMessage[] = rawMessages.filter(isChatMessage);

    if (!model || !ALLOWED_MODELS.has(model)) {
      return createErrorResponse('模型无效或暂不可用', 400, requestId);
    }

    if (messages.length === 0) {
      return createErrorResponse('缺少有效消息内容', 400, requestId);
    }

    if (!API_ENDPOINT || !API_KEY) {
      return createErrorResponse('API 未配置，请在服务端环境变量中设置 API_ENDPOINT 和 API_KEY', 500, requestId);
    }

    const inputChars = messages.reduce((total, message) => total + message.content.length, 0);

    logChatEvent(requestId, 'request_start', {
      model,
      outputMode,
      temperature,
      timeoutMs,
      messageCount: messages.length,
      inputChars,
    });

    const upstreamController = new AbortController();
    const abortUpstream = (reason: string) => {
      if (!upstreamController.signal.aborted) {
        upstreamController.abort(reason);
      }
    };

    const timeoutId = setTimeout(() => {
      abortUpstream('timeout');
    }, timeoutMs);

    request.signal.addEventListener('abort', () => {
      abortUpstream('client_abort');
    }, { once: true });

    let response: Response;

    try {
      response = await fetch(`${API_ENDPOINT}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model,
          ...(temperature === null ? {} : { temperature }),
          messages: buildMessages(messages, outputMode),
          stream: true,
        }),
        signal: upstreamController.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);

      if (upstreamController.signal.aborted) {
        const reason = String(upstreamController.signal.reason || 'aborted');
        const durationMs = Date.now() - startedAt;

        logChatEvent(requestId, 'request_aborted', {
          model,
          reason,
          durationMs,
        });

        if (reason === 'timeout') {
          return createErrorResponse(`上游响应超时，已在 ${Math.round(timeoutMs / 1000)} 秒后终止`, 504, requestId);
        }

        return createErrorResponse('请求已取消', 499, requestId);
      }

      throw error;
    }

    if (!response.ok) {
      clearTimeout(timeoutId);

      const errorText = await response.text();
      let errorMessage = `API请求失败: ${response.status}`;

      if (response.status === 413) {
        errorMessage = '请求体过大。对小说写作，建议把长期设定、人物卡、章节摘要放进“小说记忆”，不要每次都携带整章原文或过长聊天记录。';
      } else {
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch {
          errorMessage = `${errorMessage} - ${errorText.substring(0, 200)}`;
        }
      }

      logChatEvent(requestId, 'upstream_error', {
        model,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });

      return createErrorResponse(errorMessage, response.status, requestId);
    }

    if (!response.body) {
      clearTimeout(timeoutId);
      return createErrorResponse('无法读取上游响应流', 500, requestId);
    }

    const reader = response.body.getReader();
    let streamedBytes = 0;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (value) {
              streamedBytes += value.byteLength;
              controller.enqueue(value);
            }
          }

          controller.close();
          logChatEvent(requestId, 'request_complete', {
            model,
            durationMs: Date.now() - startedAt,
            streamedBytes,
          });
        } catch (error) {
          controller.error(error);
          logChatEvent(requestId, 'stream_error', {
            model,
            durationMs: Date.now() - startedAt,
            streamedBytes,
            error: error instanceof Error ? error.message : String(error),
          });
        } finally {
          clearTimeout(timeoutId);
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    logChatEvent(requestId, 'request_failed', {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse('服务器内部错误', 500, requestId);
  }
}
