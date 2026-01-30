'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-xl">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            ログアウト
          </button>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SkillLens PoC
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            事務職スキルアセスメント - 技術検証版
          </p>
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Type A: Process Tracking Logic
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            テスト概要
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">📊</span>
              <span>
                スプレッドシート操作を通じて、実務遂行能力を測定します
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">📝</span>
              <span>3つの課題から選択可能（初級・中級・上級）</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⏱️</span>
              <span>所要時間: 約10-20分（課題により異なります）</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🎯</span>
              <span>
                測定項目: 関数活用度（手動入力、フィルター機能、関数使用を判定）
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-amber-900 mb-2 flex items-center">
            <span className="mr-2">💡</span>
            テストの流れ
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-amber-800">
            <li>3つの課題から1つを選択します</li>
            <li>課題が表示されます</li>
            <li>スプレッドシート上で課題を解決してください</li>
            <li>操作ログが自動的に記録されます</li>
            <li>提出後、スコアと評価理由が表示されます</li>
          </ol>
        </div>

        <div className="text-center">
          <Link
            href="/problems"
            className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            テストを開始する
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>このシステムは実務能力の「氷山の下層」を可視化します</p>
          <p className="mt-1">履歴書では測れない、実際の処理能力を評価</p>
        </div>
      </div>
    </main>
  );
}
