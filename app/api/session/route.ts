import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProblemById } from '@/lib/problemDefinitions';

// セッションの作成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { problemId } = body;

    // 問題の存在を検証（problemIdが提供された場合のみ）
    if (problemId) {
      const problem = getProblemById(problemId);
      if (!problem) {
        return NextResponse.json(
          { error: 'Invalid problem ID' },
          { status: 400 }
        );
      }
    }

    const session = await prisma.testSession.create({
      data: {
        status: 'in_progress',
        problemId: problemId || null,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
