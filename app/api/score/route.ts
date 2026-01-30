import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateScore } from '@/lib/scoreCalculator';
import { getProblemById } from '@/lib/problemDefinitions';
import { OperationLogData } from '@/lib/types';

// スコアの計算と保存
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // セッション情報を取得（problemId含む）
    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // ログを取得
    const logs = await prisma.operationLog.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    if (logs.length === 0) {
      return NextResponse.json(
        { error: 'No logs found for this session' },
        { status: 404 }
      );
    }

    // 課題情報を取得
    let problemTitle = undefined;
    if (session.problemId) {
      const problem = getProblemById(session.problemId);
      problemTitle = problem?.title;
    }

    // ログを適切な形式に変換
    const operationLogs: OperationLogData[] = logs.map((log) => ({
      eventType: log.eventType as any,
      timestamp: log.timestamp.getTime(),
      data: JSON.parse(log.eventData),
    }));

    // スコア計算
    const result = calculateScore(operationLogs);

    // スコアを保存
    const testResult = await prisma.testResult.create({
      data: {
        sessionId,
        score: result.score,
        method: result.method,
        analysis: JSON.stringify(result),
      },
    });

    // セッションを完了状態に更新
    await prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        id: testResult.id,
        ...result,
        problemId: session.problemId,
        problemTitle,
      },
    });
  } catch (error) {
    console.error('Failed to calculate score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate score' },
      { status: 500 }
    );
  }
}

// スコア結果の取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const result = await prisma.testResult.findUnique({
      where: { sessionId },
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    const analysis = JSON.parse(result.analysis);

    return NextResponse.json({
      id: result.id,
      sessionId: result.sessionId,
      score: result.score,
      method: result.method,
      ...analysis,
    });
  } catch (error) {
    console.error('Failed to fetch score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch score' },
      { status: 500 }
    );
  }
}
