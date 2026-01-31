/**
 * 解答の検証と正解率の計算
 */

export interface AnswerValidation {
  correctCount: number;      // 正解した行数
  incorrectCount: number;    // 誤答の行数
  missedCount: number;       // 抽出漏れの行数
  totalCorrect: number;      // 正解の総数
  accuracy: number;          // 正解率 (0-100)
  precision: number;         // 適合率 (0-100) - 抽出したもののうち正解の割合
}

export interface AnswerDetail {
  correctRows: any[][];      // 正解した行
  incorrectRows: any[][];    // 誤答の行
  missedRows: any[][];       // 抽出漏れの行
}

/**
 * 解答シートのデータを検証
 * @param answerSheet 解答シートのデータ
 * @param sourceData 元データ（データシート）
 * @param searchTerm 検索対象の文字列（例: "佐藤"）
 * @param targetColumn 検索対象の列インデックス（例: 1=氏名列）
 */
export function validateAnswer(
  answerSheet: any[][],
  sourceData: any[][],
  searchTerm: string,
  targetColumn: number = 1 // デフォルトは氏名列（B列、インデックス1）
): { validation: AnswerValidation; details: AnswerDetail } {
  // 正解データを生成（元データから検索語を含む行を抽出）
  const correctAnswer = sourceData.filter((row, index) => {
    // ヘッダー行（最初の行）はスキップ
    if (index === 0) return false;
    // 行番号列を除いた実データから検索
    const targetCell = row[targetColumn];
    return targetCell && String(targetCell).includes(searchTerm);
  });

  // 解答シートから有効なデータ行を抽出
  // 行番号列以外に何かデータがある行のみを対象
  const userRows = answerSheet.filter((row, index) => {
    // ヘッダー行はスキップ
    if (index === 0) return false;
    // 行番号列（0列目）を除いて、何かデータがあるかチェック
    return row.slice(1).some(cell => cell !== null && cell !== undefined && cell !== '');
  });

  // 正解データを氏名でマップ化（重複チェック用）
  const correctNamesMap = new Map<string, any[]>();
  correctAnswer.forEach(row => {
    const name = String(row[targetColumn] || '').trim();
    if (!correctNamesMap.has(name)) {
      correctNamesMap.set(name, []);
    }
    correctNamesMap.get(name)!.push(row);
  });

  // ユーザーの回答を検証
  const correctRows: any[][] = [];
  const incorrectRows: any[][] = [];

  for (const row of userRows) {
    const name = String(row[targetColumn] || '').trim();

    if (correctNamesMap.has(name)) {
      // 正解
      correctRows.push(row);

      // この氏名の正解データから1つ消費（重複カウント防止）
      const matchingRows = correctNamesMap.get(name)!;
      if (matchingRows.length > 0) {
        matchingRows.shift();
        if (matchingRows.length === 0) {
          correctNamesMap.delete(name);
        }
      }
    } else {
      // 誤答（検索語を含まない行を抽出している）
      incorrectRows.push(row);
    }
  }

  // 抽出漏れ（正解データの残り）
  const missedRows: any[][] = [];
  correctNamesMap.forEach(rows => {
    missedRows.push(...rows);
  });

  // 統計情報の計算
  const correctCount = correctRows.length;
  const incorrectCount = incorrectRows.length;
  const missedCount = missedRows.length;
  const totalCorrect = correctAnswer.length;

  // 正解率: 正解データのうち何%を抽出できたか
  const accuracy = totalCorrect > 0
    ? Math.round((correctCount / totalCorrect) * 100)
    : 0;

  // 適合率: 抽出したもののうち何%が正解か
  const totalExtracted = correctCount + incorrectCount;
  const precision = totalExtracted > 0
    ? Math.round((correctCount / totalExtracted) * 100)
    : 0;

  return {
    validation: {
      correctCount,
      incorrectCount,
      missedCount,
      totalCorrect,
      accuracy,
      precision,
    },
    details: {
      correctRows,
      incorrectRows,
      missedRows,
    },
  };
}

/**
 * 結果評価に基づいてスコアを計算
 * @param validation 検証結果
 */
export function calculateResultScore(validation: AnswerValidation): number {
  const { accuracy, precision, incorrectCount } = validation;

  // 基本スコアは正解率
  let score = accuracy;

  // 誤答があればペナルティ（誤答1つにつき-5点、最大-30点）
  if (incorrectCount > 0) {
    const penalty = Math.min(incorrectCount * 5, 30);
    score -= penalty;
  }

  // 適合率が低い場合はペナルティ（無関係な行を大量抽出している）
  if (precision < 80 && incorrectCount > 0) {
    score -= 10;
  }

  // スコアを0-100の範囲に収める
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 結果評価のフィードバックメッセージを生成
 */
export function generateFeedback(
  validation: AnswerValidation,
  score: number
): string {
  const { correctCount, incorrectCount, missedCount, totalCorrect, accuracy, precision } = validation;

  const messages: string[] = [];

  // スコアに応じた総合評価
  if (score === 100) {
    messages.push('🎉 完璧です！全ての正解を正確に抽出できました。');
  } else if (score >= 90) {
    messages.push('✨ 素晴らしい！ほぼ完璧な抽出です。');
  } else if (score >= 70) {
    messages.push('👍 良好です。大部分を正確に抽出できています。');
  } else if (score >= 50) {
    messages.push('📝 まずまずです。もう少し精度を上げましょう。');
  } else {
    messages.push('💪 もう一度見直してみましょう。');
  }

  // 詳細情報
  messages.push(`\n【詳細】`);
  messages.push(`✓ 正解: ${correctCount}/${totalCorrect}行を抽出 (${accuracy}%)`);

  if (incorrectCount > 0) {
    messages.push(`✗ 誤答: ${incorrectCount}行が誤って含まれています`);
  }

  if (missedCount > 0) {
    messages.push(`✗ 抽出漏れ: ${missedCount}行が抽出されていません`);
  }

  if (incorrectCount === 0 && missedCount === 0) {
    messages.push(`✓ 誤答・抽出漏れなし`);
  }

  // 適合率の情報
  if (incorrectCount > 0) {
    messages.push(`\n適合率: ${precision}% (抽出したもののうち正解の割合)`);
  }

  return messages.join('\n');
}
