import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OperationLogData } from '@/lib/types';

// ログの保存
export async function POST(request: NextRequest) {
  try {
    const { sessionId, logs } = await request.json();

    if (!sessionId || !logs || !Array.isArray(logs)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // セッションの存在確認
    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // ログを一括保存
    const operationLogs = logs.map((log: OperationLogData) => ({
      sessionId,
      eventType: log.eventType,
      eventData: JSON.stringify(log.data),
      timestamp: new Date(log.timestamp),
    }));

    await prisma.operationLog.createMany({
      data: operationLogs,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save logs:', error);
    return NextResponse.json(
      { error: 'Failed to save logs' },
      { status: 500 }
    );
  }
}

// セッションのログを取得
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

    const logs = await prisma.operationLog.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
