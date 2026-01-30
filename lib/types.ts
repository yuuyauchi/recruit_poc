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
}

// テストセッション
export interface TestSessionData {
  id: string;
  startTime: number;
  endTime?: number;
  logs: OperationLogData[];
}
