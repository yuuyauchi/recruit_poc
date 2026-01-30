import { OperationLogData, ScoreResult } from './types';

/**
 * スコア計算ロジック
 * 操作ログから関数活用度を判定する
 */
export function calculateScore(logs: OperationLogData[]): ScoreResult {
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
