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

      <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <span className="text-3xl mr-3">📝</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-purple-900 mb-2">
              重要：解答シートについて
            </h3>
            <div className="space-y-1 text-sm text-purple-800">
              <p className="font-semibold">
                • 「データ」シートは<strong className="text-purple-900">閲覧専用</strong>です（編集できません）
              </p>
              <p className="font-semibold">
                • 答えは必ず<strong className="text-purple-900">「📝解答シート」タブ</strong>に記入してください
              </p>
              <p className="text-xs text-purple-700 mt-2">
                ※ シートタブは画面下部にあります。「📝解答シート」をクリックして切り替えてから作業してください。
              </p>
            </div>
          </div>
        </div>
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
            <p className="font-medium">📝解答シートで作業:</p>
            <ol className="text-xs space-y-1 ml-4 list-decimal">
              <li>データシートの全データを解答シートにコピー</li>
              <li>解答シートのG列などに数式を入力</li>
              <li><code className="bg-white px-1 rounded">  =FILTER(A:E, ISNUMBER(SEARCH(&quot;佐藤&quot;, B:B)))</code></li>
            </ol>
            <p className="text-xs text-gray-600 mt-1">
              ※ コピー後、解答シート内で数式を使用
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
            <p>📝解答シートで作業:</p>
            <ol className="text-xs space-y-1 ml-4 list-decimal">
              <li>データシートの全データを解答シートにコピー</li>
              <li>「氏名」ヘッダーの<strong>▼ボタン</strong>をクリック</li>
              <li>「条件でフィルタ」→「次を含む」→「佐藤」</li>
              <li>OKをクリックしてフィルター適用</li>
            </ol>
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
            <p className="text-xs">データシートで「佐藤」を目視で探し、該当行を解答シートに手動でコピー&ペースト</p>
            <p className="text-xs text-red-600 mt-2">
              ※ 効率が悪く実務では非推奨
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
        <p className="text-sm text-amber-900">
          <strong>💡 ポイント:</strong>
          データシートは閲覧専用なので、まず解答シートにデータをコピーしてから作業を開始してください。
          フィルター機能を使うとテーブルが絞り込まれ、FILTER関数を使うと別の場所に結果が表示されます。
          すべての操作はログとして記録され、スコアに反映されます。
        </p>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>※ すべての操作は自動的に記録されます</p>
        <p>※ 完了したら「提出」ボタンをクリックしてください</p>
      </div>
    </div>
  );
}
