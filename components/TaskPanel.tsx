'use client';

import { useState } from 'react';

interface TaskPanelProps {
  timeRemaining?: number;
  taskDescription: {
    title: string;
    instruction: string;
    hints?: string[];
  };
}

export default function TaskPanel({ timeRemaining, taskDescription }: TaskPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`bg-white border-r border-gray-300 transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-80'
      } flex flex-col h-full overflow-hidden`}
    >
      {/* ヘッダー */}
      <div className="bg-blue-600 text-white p-3 flex items-center justify-between">
        {!isCollapsed && (
          <h3 className="font-semibold text-sm">課題説明</h3>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-blue-700 rounded transition-colors"
          title={isCollapsed ? '課題を表示' : '課題を非表示'}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* タイマー */}
          {timeRemaining !== undefined && (
            <div
              className={`text-center p-3 rounded-lg font-bold ${
                timeRemaining < 60
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              <div className="text-xs mb-1">残り時間</div>
              <div className="text-2xl">{formatTime(timeRemaining)}</div>
            </div>
          )}

          {/* 課題タイトル */}
          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              {taskDescription.title}
            </h4>
            <p className="text-sm text-gray-700 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              {taskDescription.instruction}
            </p>
          </div>

          {/* 解法 */}
          <div className="space-y-3">
            <h5 className="font-semibold text-gray-800 text-sm">解法：</h5>

            {/* 方法1: FILTER関数 */}
            <div className="bg-green-50 border-2 border-green-500 rounded p-3">
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">🏆</span>
                <div>
                  <div className="font-bold text-green-800 text-sm">
                    FILTER関数
                  </div>
                  <div className="text-green-600 text-xs font-semibold">
                    100点
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-700 space-y-2">
                <p className="font-medium">G1などの空セルに数式入力:</p>
                <code className="block bg-white p-2 rounded text-[10px] break-all">
                  =FILTER(A:E, &quot;佐藤&quot;, B:B)
                </code>
                <p className="text-gray-600 text-[10px] mt-1">
                  ※ A:Eの範囲から、B列に「佐藤」を含む行を抽出
                </p>
              </div>
            </div>

            {/* 方法2: フィルター機能 */}
            <div className="bg-blue-50 border-2 border-blue-500 rounded p-3">
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">👍</span>
                <div>
                  <div className="font-bold text-blue-800 text-sm">
                    フィルター機能
                  </div>
                  <div className="text-blue-600 text-xs font-semibold">
                    50点
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-700 space-y-1">
                <p>1. 「氏名」ヘッダーをクリック</p>
                <p>
                  2. 右側の<strong>▼ボタン</strong>をクリック
                </p>
                <p>3. 「条件でフィルタ」を選択</p>
                <p>4. 「次を含む」→「佐藤」入力</p>
              </div>
            </div>

            {/* 方法3: 手動 */}
            <div className="bg-red-50 border-2 border-red-300 rounded p-3">
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">😅</span>
                <div>
                  <div className="font-bold text-red-800 text-sm">
                    手動コピー
                  </div>
                  <div className="text-red-600 text-xs font-semibold">0点</div>
                </div>
              </div>
              <div className="text-xs text-gray-700">
                <p>目視で探してコピー&ペースト</p>
                <p className="text-red-600 mt-1">※ 非推奨</p>
              </div>
            </div>
          </div>

          {/* ヒント */}
          <div className="bg-amber-50 border border-amber-300 rounded p-3">
            <p className="text-xs text-amber-900">
              <strong>💡 ポイント:</strong>
              フィルター機能を使うと元のテーブルが絞り込まれます。
              FILTER関数を使うと別の場所（G列など）に結果が表示されます。
            </p>
          </div>

          {/* 注意事項 */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>※ すべての操作は自動的に記録されます</p>
            <p>※ 完了したら「提出」ボタンをクリック</p>
          </div>
        </div>
      )}

      {/* 折りたたみ時のアイコン */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center justify-start pt-4 space-y-4">
          <div className="text-2xl rotate-90 whitespace-nowrap text-gray-600">
            📋
          </div>
          <div className="text-xs text-gray-500 transform -rotate-90 whitespace-nowrap">
            課題
          </div>
        </div>
      )}
    </div>
  );
}
