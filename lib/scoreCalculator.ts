import { OperationLogData, ScoreResult } from './types';
import { validateAnswer, calculateResultScore, generateFeedback } from './answerValidator';

/**
 * スコア計算ロジック（プロセス評価のみ）
 * 操作ログから関数活用度を判定する
 */
export function calculateProcessScore(logs: OperationLogData[]): ScoreResult {
  // 検出する要素
  let hasAdvancedFormula = false;
  let hasFilter = false;
  let hasManualEdit = false;
  const formulasUsed: string[] = [];

  // 時間計算
  const startTime = logs[0]?.timestamp || Date.now();
  const endTime = logs[logs.length - 1]?.timestamp || Date.now();
  const timeSpent = Math.round((endTime - startTime) / 1000);

  // ログを解析
  for (const log of logs) {
    switch (log.eventType) {
      case 'FORMULA_INPUT':
        const formula = log.data.formula || '';
        formulasUsed.push(formula);

        // FILTER, QUERY, VLOOKUP などの高度な関数を検出
        const advancedFunctions = /FILTER|QUERY|VLOOKUP|HLOOKUP|INDEX|MATCH/i;
        if (advancedFunctions.test(formula)) {
          hasAdvancedFormula = true;
        }
        break;

      case 'FILTER_APPLY':
        hasFilter = true;
        break;

      case 'CELL_EDIT':
        // フィルターや関数を使わない手動編集
        if (!hasFilter && !hasAdvancedFormula) {
          hasManualEdit = true;
        }
        break;
    }
  }

  // スコアリングルール
  let score = 0;
  let method = '';
  let reasoning = '';

  if (hasAdvancedFormula) {
    score = 100;
    method = '関数活用';
    reasoning = `FILTER, QUERY等の高度な関数を使用して課題を解決しました。効率的なデータ処理能力が認められます。検出された関数: ${formulasUsed.join(', ')}`;
  } else if (hasFilter) {
    score = 50;
    method = 'フィルター機能';
    reasoning = 'スプレッドシートのフィルター機能を使用して課題を解決しました。基本的なデータ抽出スキルが認められます。';
  } else if (hasManualEdit) {
    score = 0;
    method = '手動作業';
    reasoning = '手動でのセル編集のみで課題を解決しようとしました。関数やフィルター機能を活用することで、より効率的な処理が可能です。';
  } else {
    score = 0;
    method = '未完了';
    reasoning = '有効な操作が検出されませんでした。';
  }

  return {
    score,
    method,
    reasoning,
    detectedActions: {
      hasAdvancedFormula,
      hasFilter,
      hasManualEdit,
      formulasUsed,
      totalOperations: logs.length,
      timeSpent,
    },
  };
}

/**
 * 統合評価: プロセス評価 + 結果評価
 * @param logs 操作ログ
 * @param answerSheet 解答シートのデータ
 * @param sourceData 元データ（データシート）
 * @param searchTerm 検索対象の文字列
 * @param targetColumn 検索対象の列インデックス
 */
export function calculateFinalScore(
  logs: OperationLogData[],
  answerSheet: any[][] | null,
  sourceData: any[][] | null,
  searchTerm: string = '佐藤',
  targetColumn: number = 1
): ScoreResult {
  // プロセス評価
  const processResult = calculateProcessScore(logs);
  const processScore = processResult.score;

  // 結果評価（解答シートとソースデータがある場合のみ）
  let resultScore = 0;
  let resultEvaluation = undefined;

  if (answerSheet && sourceData && answerSheet.length > 0 && sourceData.length > 0) {
    const { validation, details } = validateAnswer(
      answerSheet,
      sourceData,
      searchTerm,
      targetColumn
    );

    resultScore = calculateResultScore(validation);
    const feedback = generateFeedback(validation, resultScore);

    resultEvaluation = {
      score: resultScore,
      validation,
      feedback,
    };
  }

  // 統合スコアの計算
  const processWeight = 0.5; // 50%
  const resultWeight = 0.5;  // 50%

  const finalScore = resultEvaluation
    ? Math.round(processScore * processWeight + resultScore * resultWeight)
    : processScore; // 結果評価がない場合はプロセススコアのみ

  return {
    ...processResult,
    score: finalScore, // 統合スコアをメインスコアとして設定
    resultEvaluation,
    finalScore,
    breakdown: resultEvaluation ? {
      processScore,
      resultScore,
      processWeight,
      resultWeight,
    } : undefined,
  };
}

/**
 * 後方互換性のため、既存のcalculateScore関数を維持
 * プロセス評価のみを実行
 */
export function calculateScore(logs: OperationLogData[]): ScoreResult {
  return calculateProcessScore(logs);
}
