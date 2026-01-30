import Link from 'next/link';
import { ScoreResult } from '@/lib/types';

interface ResultsPanelProps {
  result: ScoreResult;
  problemTitle?: string;
}

export default function ResultsPanel({ result, problemTitle }: ResultsPanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🎉';
    if (score >= 50) return '👍';
    return '💪';
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{getScoreEmoji(result.score)}</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          テスト結果
        </h2>
        {problemTitle && (
          <p className="text-gray-600 mb-4">課題: {problemTitle}</p>
        )}
        <div
          className={`inline-block text-6xl font-bold px-8 py-4 rounded-xl border-4 ${getScoreColor(
            result.score
          )}`}
        >
          {result.score}点
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-blue-900 mb-3">
            判定: {result.method}
          </h3>
          <p className="text-gray-700 leading-relaxed">{result.reasoning}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">総操作数</div>
          <div className="text-2xl font-bold text-gray-900">
            {result.detectedActions.totalOperations}回
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">所要時間</div>
          <div className="text-2xl font-bold text-gray-900">
            {result.detectedActions.timeSpent}秒
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">
          検出された操作:
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">
              高度な関数の使用 (FILTER/QUERY等)
            </span>
            <span
              className={`font-semibold ${
                result.detectedActions.hasAdvancedFormula
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              {result.detectedActions.hasAdvancedFormula ? '✓ 検出' : '✗ 未使用'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">フィルター機能の使用</span>
            <span
              className={`font-semibold ${
                result.detectedActions.hasFilter
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              {result.detectedActions.hasFilter ? '✓ 検出' : '✗ 未使用'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">手動編集</span>
            <span
              className={`font-semibold ${
                result.detectedActions.hasManualEdit
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}
            >
              {result.detectedActions.hasManualEdit ? '✓ 検出' : '✗ なし'}
            </span>
          </div>
        </div>

        {result.detectedActions.formulasUsed.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">使用された数式:</div>
            <div className="bg-white p-3 rounded border border-gray-200 font-mono text-sm">
              {result.detectedActions.formulasUsed.join(', ')}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-4 justify-center">
        <Link
          href="/problems"
          className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          別の課題に挑戦
        </Link>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
        >
          トップページに戻る
        </Link>
      </div>
    </div>
  );
}
