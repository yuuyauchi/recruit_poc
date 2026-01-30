export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeLimit: number; // seconds
  timeEstimate: string;
  icon: string;
  csvFileName: string;
  taskDescription: {
    title: string;
    instruction: string;
    hints?: string[];
  };
  skills: string[];
  isActive: boolean;
}

export const problems: Problem[] = [
  {
    id: 'roster-extraction',
    title: 'データ抽出',
    description: '名簿から特定の条件に合う行を抽出する基本的なタスクです。フィルター機能やFILTER関数の使い方を学びます。',
    difficulty: 'beginner',
    timeLimit: 600, // 10分
    timeEstimate: '10分',
    icon: '📋',
    csvFileName: 'roster.csv',
    taskDescription: {
      title: '課題: データ抽出',
      instruction: 'この名簿から「佐藤」を含む行をすべて抽出してください。',
      hints: [
        'フィルター機能を使用する方法',
        'FILTER関数やQUERY関数を使用する方法',
        '手動で探してコピーする方法',
      ],
    },
    skills: ['データフィルタリング', 'FILTER関数', '条件検索'],
    isActive: true,
  },
  {
    id: 'sales-analysis',
    title: '売上分析',
    description: '売上データから部門別の集計を行います。SUMIF関数やピボットテーブルの使い方を習得します。',
    difficulty: 'intermediate',
    timeLimit: 900, // 15分
    timeEstimate: '15分',
    icon: '📊',
    csvFileName: 'sales.csv',
    taskDescription: {
      title: '課題: 売上分析',
      instruction: '各部署の売上合計を計算し、上位3部署を特定してください。',
      hints: [
        'SUMIF関数を使用して部署別に集計',
        'ピボットテーブルを活用する方法',
        'SORT関数で並び替える',
      ],
    },
    skills: ['集計関数', 'SUMIF', 'データ分析', 'ソート'],
    isActive: true,
  },
  {
    id: 'inventory-management',
    title: '在庫管理',
    description: '在庫データの整合性をチェックし、重複や欠損を見つけます。複数の関数を組み合わせた高度な分析が必要です。',
    difficulty: 'advanced',
    timeLimit: 1200, // 20分
    timeEstimate: '20分',
    icon: '📦',
    csvFileName: 'inventory.csv',
    taskDescription: {
      title: '課題: 在庫管理',
      instruction: '在庫データから重複IDを検出し、在庫数が0または負の値の商品をリストアップしてください。',
      hints: [
        'COUNTIF関数で重複をチェック',
        '複数条件を組み合わせてフィルタリング',
        'UNIQUE関数やFILTER関数を活用',
      ],
    },
    skills: ['データクレンジング', 'COUNTIF', '複数条件フィルタ', '重複検出'],
    isActive: true,
  },
];

/**
 * Get a problem by its ID
 */
export function getProblemById(id: string): Problem | undefined {
  return problems.find((p) => p.id === id && p.isActive);
}

/**
 * Get all active problems
 */
export function getActiveProblems(): Problem[] {
  return problems.filter((p) => p.isActive);
}

/**
 * Get problems filtered by difficulty
 */
export function getProblemsByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Problem[] {
  return problems.filter((p) => p.isActive && p.difficulty === difficulty);
}
