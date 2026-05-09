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
      signal: request.signal,
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

    if (!response.body) {
      return NextResponse.json(
        { error: '无法读取上游响应流' },
        { status: 500 }
      );
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/event-stream',
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
