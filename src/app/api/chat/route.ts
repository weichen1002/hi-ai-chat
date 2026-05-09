import { NextRequest, NextResponse } from 'next/server';

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || '';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json();

    if (!messages || !model) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const endpoint = API_ENDPOINT;
    const key = API_KEY;

    if (!endpoint || !key) {
      return NextResponse.json(
        { error: 'API未配置，请在 .env.local 中设置 NEXT_PUBLIC_API_ENDPOINT 和 NEXT_PUBLIC_API_KEY' },
        { status: 500 }
      );
    }

    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API请求失败: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage} - ${errorText.substring(0, 200)}`;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // 直接透传上游 SSE 流，保持原始格式
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { error: '无法读取上游响应流' },
        { status: 500 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('流处理错误:', error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('聊天API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
