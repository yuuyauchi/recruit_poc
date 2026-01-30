'use client';

import { useRef, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import { OperationLogData, EventType } from '@/lib/types';

interface SpreadsheetEditorProps {
  data: any[][];
  onLogEvent: (log: OperationLogData) => void;
}

export default function SpreadsheetEditor({
  data,
  onLogEvent,
}: SpreadsheetEditorProps) {
  const hotRef = useRef<any>(null);

  // 最初の行をヘッダーとして使用し、残りをデータとする
  const headers = data[0] || [];
  const tableData = data.slice(1);

  useEffect(() => {
    // 初期ロードイベント
    onLogEvent({
      eventType: 'SESSION_START',
      timestamp: Date.now(),
      data: {
        rowCount: data.length,
        colCount: data[0]?.length || 0,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAfterChange = (
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ) => {
    if (!changes || source === 'loadData') return;

    changes.forEach(([row, col, oldValue, newValue]) => {
      // 数式の検出
      if (
        typeof newValue === 'string' &&
        newValue.trim().startsWith('=')
      ) {
        onLogEvent({
          eventType: 'FORMULA_INPUT',
          timestamp: Date.now(),
          data: {
            row,
            col: typeof col === 'number' ? col : 0,
            formula: newValue,
            oldValue: oldValue as string,
          },
        });
      } else {
        // 通常のセル編集
        onLogEvent({
          eventType: 'CELL_EDIT',
          timestamp: Date.now(),
          data: {
            row,
            col: typeof col === 'number' ? col : 0,
            oldValue: oldValue as string,
            newValue: newValue as string,
          },
        });
      }
    });
  };

  const handleAfterFilter = (conditionsStack: any[]) => {
    if (conditionsStack && conditionsStack.length > 0) {
      const lastCondition = conditionsStack[conditionsStack.length - 1];
      onLogEvent({
        eventType: 'FILTER_APPLY',
        timestamp: Date.now(),
        data: {
          filterColumn: lastCondition.column,
          filterCondition: JSON.stringify(lastCondition.conditions),
        },
      });
    }
  };

  const handleAfterCopy = (
    data: any[][],
    coords: any[]
  ) => {
    if (coords && coords.length > 0) {
      const range = coords[0];
      onLogEvent({
        eventType: 'COPY_PASTE',
        timestamp: Date.now(),
        data: {
          action: 'copy',
          range: {
            startRow: range.startRow,
            startCol: range.startCol,
            endRow: range.endRow,
            endCol: range.endCol,
          },
        },
      });
    }
  };

  return (
    <div className="w-full h-full">
      <HotTable
        ref={hotRef}
        data={tableData}
        colHeaders={headers}
        rowHeaders={true}
        width="100%"
        height="600px"
        licenseKey="non-commercial-and-evaluation"
        // 列幅の設定（Excel風に調整）
        colWidths={[60, 140, 100, 100, 80]}
        // 列のタイプとアライメント
        columns={[
          { data: 0, type: 'text' },  // ID
          { data: 1, type: 'text' },  // 氏名
          { data: 2, type: 'text' },  // 部署
          { data: 3, type: 'text' },  // 役職
          { data: 4, type: 'text', className: 'htRight' }  // 入社年（右揃え）
        ]}
        // フィルター機能を有効化
        filters={true}
        // ドロップダウンメニューを有効化（フィルターボタンを表示）
        dropdownMenu={{
          items: {
            filter_by_condition: {},
            filter_by_value: {},
            filter_action_bar: {},
          }
        }}
        // コンテキストメニュー（Excelスタイル）
        contextMenu={[
          'row_above',
          'row_below',
          'col_left',
          'col_right',
          '---------',
          'remove_row',
          'remove_col',
          '---------',
          'undo',
          'redo',
          '---------',
          'copy',
          'cut',
        ]}
        // イベントハンドラー
        afterChange={handleAfterChange}
        afterFilter={handleAfterFilter}
        afterCopy={handleAfterCopy}
        // その他の設定（Excel風）
        stretchH="all"
        autoWrapRow={false}
        autoWrapCol={false}
        manualColumnResize={true}
        manualRowResize={true}
        manualColumnMove={false}
        manualRowMove={false}
        // セル選択動作
        selectionMode="multiple"
        outsideClickDeselects={false}
        // スクロール設定
        preventOverflow="horizontal"
        className="htMiddle"
      />
    </div>
  );
}
