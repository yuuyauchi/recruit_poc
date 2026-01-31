// 操作ログのイベントタイプ
export type EventType =
  | 'CELL_EDIT'
  | 'FILTER_APPLY'
  | 'FORMULA_INPUT'
  | 'COPY_PASTE'
  | 'SUBMIT'
  | 'SESSION_START'
  | 'TOOLBAR_ACTION';

// 操作ログのデータ構造
export interface OperationLogData {
  eventType: EventType;
  timestamp: number;
  data: {
    row?: number;
    col?: number;
    oldValue?: string;
    newValue?: string;
    formula?: string;
    filterColumn?: string;
    filterCondition?: string;
    range?: {
      startRow: number;
      startCol: number;
      endRow: number;
      endCol: number;
    };
    [key: string]: any;
  };
}

// スコア計算結果
export interface ScoreResult {
  score: number;
  method: string;
  reasoning: string;
  detectedActions: {
    hasAdvancedFormula: boolean;
    hasFilter: boolean;
    hasManualEdit: boolean;
    formulasUsed: string[];
    totalOperations: number;
    timeSpent: number; // seconds
  };
  // 結果評価（追加）
  resultEvaluation?: {
    score: number;           // 結果評価スコア (0-100)
    validation: {
      correctCount: number;
      incorrectCount: number;
      missedCount: number;
      totalCorrect: number;
      accuracy: number;
      precision: number;
    };
    feedback: string;
  };
  // 統合スコア（追加）
  finalScore?: number;       // プロセス + 結果の統合スコア
  breakdown?: {
    processScore: number;    // プロセス評価スコア
    resultScore: number;     // 結果評価スコア
    processWeight: number;   // プロセスの重み (0-1)
    resultWeight: number;    // 結果の重み (0-1)
  };
}

// テストセッション
export interface TestSessionData {
  id: string;
  startTime: number;
  endTime?: number;
  logs: OperationLogData[];
}
