import { NextResponse } from 'next/server';
import { AVAILABLE_MODELS } from '@/lib/api';

export async function GET() {
  try {
    return NextResponse.json({ models: AVAILABLE_MODELS });
  } catch (error) {
    console.error('获取模型列表错误:', error);
    return NextResponse.json(
      { error: '获取模型列表失败' },
      { status: 500 }
    );
  }
}
