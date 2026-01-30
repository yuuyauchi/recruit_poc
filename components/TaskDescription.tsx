import { taskDescription } from '@/lib/sampleData';

interface TaskDescriptionProps {
  timeRemaining?: number;
}

export default function TaskDescription({
  timeRemaining,
}: TaskDescriptionProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {taskDescription.title}
        </h2>
        {timeRemaining !== undefined && (
          <div
            className={`text-lg font-semibold px-4 py-2 rounded-lg ${
              timeRemaining < 60
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            残り時間: {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
        <p className="text-lg text-gray-800 font-medium mb-2">
          {taskDescription.instruction}
        </p>
        <p className="text-sm text-blue-700 font-semibold">
          ✓ 完了したら画面下部の「提出する」ボタンをクリックしてください
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🏆</span>
            <div>
              <h4 className="font-bold text-green-800">方法1: FILTER関数</h4>
              <span className="text-green-600 text-sm font-semibold">100点</span>
            </div>
          </div>
          <div className="text-sm text-gray-700 space-y-2">
            <p className="font-medium">G列などの空セルに数式入力:</p>
            <code className="block bg-white p-2 rounded text-xs break-all">
              =FILTER(A:E, ISNUMBER(SEARCH(&quot;佐藤&quot;, B:B)))
            </code>
            <p className="text-xs text-gray-600">
              ※ セルG1をクリックして上記を入力
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">👍</span>
            <div>
              <h4 className="font-bold text-blue-800">方法2: フィルター機能</h4>
              <span className="text-blue-600 text-sm font-semibold">50点</span>
            </div>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p>1. 「氏名」ヘッダーをクリック</p>
            <p>2. 右側の<strong>▼ボタン</strong>をクリック</p>
            <p>3. 「条件でフィルタ」を選択</p>
            <p>4. 「次を含む」→「佐藤」入力</p>
            <p>5. OKをクリック</p>
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">😅</span>
            <div>
              <h4 className="font-bold text-red-800">方法3: 手動コピー</h4>
              <span className="text-red-600 text-sm font-semibold">0点</span>
            </div>
          </div>
          <div className="text-sm text-gray-700">
            <p>目視で「佐藤」を探して手動でコピー&ペースト</p>
            <p className="text-xs text-red-600 mt-2">
              ※ 効率が悪いため非推奨
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
        <p className="text-sm text-amber-900">
          <strong>💡 ポイント:</strong>
          フィルター機能を使うと元のテーブルが絞り込まれます。
          FILTER関数を使うと別の場所（G列など）に結果が表示されます。
          どちらも操作ログとして記録され、スコアに反映されます。
        </p>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>※ すべての操作は自動的に記録されます</p>
        <p>※ 完了したら「提出」ボタンをクリックしてください</p>
      </div>
    </div>
  );
}
