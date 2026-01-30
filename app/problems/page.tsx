'use client';

import Link from 'next/link';
import { getActiveProblems, Problem } from '@/lib/problemDefinitions';

const difficultyStyles = {
  beginner: {
    badge: 'bg-green-100 text-green-800 border-green-300',
    label: '初級',
  },
  intermediate: {
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    label: '中級',
  },
  advanced: {
    badge: 'bg-red-100 text-red-800 border-red-300',
    label: '上級',
  },
};

function ProblemCard({ problem }: { problem: Problem }) {
  const difficultyStyle = difficultyStyles[problem.difficulty];

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-4xl">{problem.icon}</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyStyle.badge}`}
          >
            {difficultyStyle.label}
          </span>
        </div>
        <h3 className="text-2xl font-bold mb-1">{problem.title}</h3>
        <p className="text-blue-100 text-sm">所要時間: {problem.timeEstimate}</p>
      </div>

      {/* Card Body */}
      <div className="p-6">
        <p className="text-gray-700 mb-4 leading-relaxed">
          {problem.description}
        </p>

        {/* Skills */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            習得スキル
          </h4>
          <div className="flex flex-wrap gap-2">
            {problem.skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Task Preview */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            {problem.taskDescription.title}
          </h4>
          <p className="text-sm text-gray-600">
            {problem.taskDescription.instruction}
          </p>
        </div>

        {/* Start Button */}
        <Link
          href={`/test/${problem.id}`}
          className="block w-full text-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          テスト開始
        </Link>
      </div>
    </div>
  );
}

export default function ProblemsPage() {
  const problems = getActiveProblems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                課題を選択してください
              </h1>
              <p className="text-gray-600 mt-1">
                3つの課題から1つを選び、スキルを試してみましょう
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← トップに戻る
            </Link>
          </div>
        </div>
      </div>

      {/* Problems Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              課題の進め方
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2 text-blue-600">1.</span>
                <span>上記のカードから課題を選択し、「テスト開始」をクリック</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-600">2.</span>
                <span>
                  擬似Excelインターフェースで課題に取り組む（すべての操作が記録されます）
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-600">3.</span>
                <span>完了したら「提出する」ボタンをクリック</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-600">4.</span>
                <span>
                  操作ログに基づいたスコアと評価が表示されます
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
