'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import TaskPanel from '@/components/TaskPanel';
import ResultsPanel from '@/components/ResultsPanel';
import { getProblemById } from '@/lib/problemDefinitions';
import { loadCsvData, generateEmptyData } from '@/lib/loadCsvData';
import { OperationLogData, ScoreResult } from '@/lib/types';
import type { ExcelLikeInterfaceRef } from '@/components/ExcelLikeInterface';

// ExcelLikeInterfaceを動的インポート（SSR回避）
const ExcelLikeInterface = dynamic(
  () => import('@/components/ExcelLikeInterface'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">スプレッドシートを読み込み中...</p>
        </div>
      </div>
    )
  }
);

export default function TestPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.problemId as string;

  const [problem, setProblem] = useState<ReturnType<typeof getProblemById>>(undefined);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [logs, setLogs] = useState<OperationLogData[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ExcelLikeInterfaceへの参照
  const excelRef = useRef<ExcelLikeInterfaceRef>(null);

  // 問題の検証
  useEffect(() => {
    const foundProblem = getProblemById(problemId);
    if (!foundProblem) {
      router.push('/problems');
      return;
    }
    setProblem(foundProblem);
    setTimeRemaining(foundProblem.timeLimit);
  }, [problemId, router]);

  // CSVデータの読み込み
  useEffect(() => {
    if (!problem) return;

    const loadData = async () => {
      try {
        const data = await loadCsvData(`/data/${problem.csvFileName}`);
        setCsvData(data);
        console.log('CSV data loaded:', data.length, 'rows');
      } catch (err) {
        console.error('CSV loading error:', err);
        // フォールバック：空データを生成
        const emptyData = generateEmptyData(500, 27);
        setCsvData(emptyData);
        setError('CSVファイルの読み込みに失敗しました。空のデータを表示しています。');
      }
    };

    loadData();
  }, [problem]);

  // セッション開始
  useEffect(() => {
    if (!problem) return;

    const initSession = async () => {
      try {
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemId: problem.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const data = await response.json();
        setSessionId(data.sessionId);
      } catch (err) {
        console.error('Session initialization error:', err);
        setError('セッションの開始に失敗しました');
      }
    };

    initSession();
  }, [problem]);

  // タイマー
  useEffect(() => {
    if (result || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, result]);

  // ログイベントの記録
  const handleLogEvent = useCallback((log: OperationLogData) => {
    setLogs((prev) => [...prev, log]);
    console.log('Log recorded:', log);
  }, []);

  // 提出処理
  const handleSubmit = async () => {
    if (!sessionId || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 提出イベントをログに追加
      const submitLog: OperationLogData = {
        eventType: 'SUBMIT',
        timestamp: Date.now(),
        data: {},
      };
      const allLogs = [...logs, submitLog];

      // ログを保存
      const logsResponse = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          logs: allLogs,
        }),
      });

      if (!logsResponse.ok) {
        throw new Error('Failed to save logs');
      }

      // 解答シートとソースデータを取得
      const answerSheetData = excelRef.current?.getAnswerSheetData() || null;
      const sourceData = excelRef.current?.getSourceData() || null;

      console.log('Submitting answer sheet data:', {
        answerSheetRows: answerSheetData?.length || 0,
        sourceDataRows: sourceData?.length || 0,
      });

      // スコアを計算（解答シートとソースデータを含む）
      const scoreResponse = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answerSheetData,
          sourceData,
        }),
      });

      if (!scoreResponse.ok) {
        throw new Error('Failed to calculate score');
      }

      const scoreData = await scoreResponse.json();
      setResult(scoreData.result);
    } catch (err) {
      console.error('Submission error:', err);
      setError('提出に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">エラー</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/problems')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            課題選択に戻る
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <ResultsPanel result={result} problemTitle={problem?.title} />
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 上部のツールバー - 提出ボタンとステータス */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">
            SkillLens アセスメント - {problem.title}
          </h1>
          <div className="text-sm text-gray-300">
            操作ログ: {logs.length}件
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !sessionId}
          className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors ${
            isSubmitting || !sessionId
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isSubmitting ? '提出中...' : '提出する'}
        </button>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左サイドバー - 課題パネル */}
        <TaskPanel
          timeRemaining={timeRemaining}
          taskDescription={problem.taskDescription}
        />

        {/* Excel風インターフェース */}
        <div className="flex-1 overflow-hidden">
          {sessionId && csvData ? (
            <ExcelLikeInterface
              ref={excelRef}
              data={csvData}
              onLogEvent={handleLogEvent}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {!csvData ? 'データを読み込み中...' : 'セッションを初期化中...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
