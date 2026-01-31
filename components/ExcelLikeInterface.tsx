'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import { registerAllModules } from 'handsontable/registry';
import { OperationLogData } from '@/lib/types';
import { evaluateFormula } from '@/lib/formulaEngine';

// Handsontableの全モジュール（Formulasプラグイン含む）を登録
registerAllModules();

interface ExcelLikeInterfaceProps {
  data: any[][];
  onLogEvent: (log: OperationLogData) => void;
}

// スピル範囲の型定義
interface SpillRange {
  originRow: number;
  originCol: number;
  rows: number;
  cols: number;
}

// シート型定義
interface Sheet {
  id: string;
  name: string;
  data: any[][];
  cellStyles: Map<string, Set<string>>;
  spillRanges: SpillRange[]; // スピルされている範囲の配列
  cellFormulas: Map<string, string>; // セルの数式を保存 (key: "row,col", value: "=FORMULA")
}

export default function ExcelLikeInterface({
  data,
  onLogEvent,
}: ExcelLikeInterfaceProps) {
  const hotRef = useRef<any>(null);
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [formulaBarValue, setFormulaBarValue] = useState<string>('');
  const [activeRibbonTab, setActiveRibbonTab] = useState<string>('ホーム');
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [showBorderMenu, setShowBorderMenu] = useState<boolean>(false);
  const [isFilterEnabled, setIsFilterEnabled] = useState<boolean>(false);
  
  // 複数シート管理
  const [sheets, setSheets] = useState<Sheet[]>(() => {
    console.log('Initializing sheets with data length:', data.length);

    // Sheet1: 各行の先頭に行番号を追加
    const sheet1Data = data.map((row, index) => [String(index + 1), ...row]);

    // Sheet2とSheet3: 空の500行、各行の先頭に行番号
    const emptySheetData = Array(500).fill(null).map((_, rowIndex) => {
      const row = Array(data[0].length).fill('');
      return [String(rowIndex + 1), ...row];
    });

    console.log('Sheet1 total rows:', sheet1Data.length);
    console.log('Sheet2 total rows:', emptySheetData.length);

    return [
      { id: 'sheet1', name: 'Sheet1', data: sheet1Data, cellStyles: new Map(), spillRanges: [], cellFormulas: new Map() },
      { id: 'sheet2', name: 'Sheet2', data: emptySheetData, cellStyles: new Map(), spillRanges: [], cellFormulas: new Map() },
      { id: 'sheet3', name: 'Sheet3', data: emptySheetData, cellStyles: new Map(), spillRanges: [], cellFormulas: new Map() },
    ];
  });
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  
  // セルのスタイルを保存するMap（現在のシート用）
  const cellStylesRef = useRef<Map<string, Set<string>>>(sheets[activeSheetIndex].cellStyles);
  const borderMenuRef = useRef<HTMLDivElement>(null);

  // ホームタブの機能ハンドラー
  const handleCopy = () => {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      const selected = hot.getSelected();
      if (selected && selected.length > 0) {
        const copyPastePlugin = hot.getPlugin('CopyPaste');
        if (copyPastePlugin && copyPastePlugin.isEnabled()) {
          copyPastePlugin.copy();
          onLogEvent({
            eventType: 'TOOLBAR_ACTION',
            timestamp: Date.now(),
            data: { action: 'copy' },
          });
        }
      }
    }
  };;

  const handleCut = () => {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      const selected = hot.getSelected();
      if (selected) {
        hot.getPlugin('CopyPaste').cut();
        onLogEvent({
          eventType: 'TOOLBAR_ACTION',
          timestamp: Date.now(),
          data: { action: 'cut' },
        });
      }
    }
  };

  const handlePaste = () => {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      hot.getPlugin('CopyPaste').paste();
      onLogEvent({
        eventType: 'TOOLBAR_ACTION',
        timestamp: Date.now(),
        data: { action: 'paste' },
      });
    }
  };

  const applyCellStyle = (style: string, value?: any) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected || selected.length === 0) return;

    const [row1, col1, row2, col2] = selected[0];
    const startRow = Math.min(row1, row2);
    const endRow = Math.max(row1, row2);
    const startCol = Math.min(col1, col2);
    const endCol = Math.max(col1, col2);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellKey = `${row},${col}`;
        let styles = cellStylesRef.current.get(cellKey) || new Set<string>();

        // セルが選択範囲のどの位置にあるかを判定
        const isTopEdge = row === startRow;
        const isBottomEdge = row === endRow;
        const isLeftEdge = col === startCol;
        const isRightEdge = col === endCol;

        switch (style) {
          case 'bold':
            if (styles.has('htBold')) {
              styles.delete('htBold');
            } else {
              styles.add('htBold');
            }
            break;
          case 'italic':
            if (styles.has('htItalic')) {
              styles.delete('htItalic');
            } else {
              styles.add('htItalic');
            }
            break;
          case 'underline':
            if (styles.has('htUnderline')) {
              styles.delete('htUnderline');
            } else {
              styles.add('htUnderline');
            }
            break;
          case 'left':
            styles.delete('htLeft');
            styles.delete('htCenter');
            styles.delete('htRight');
            styles.add('htLeft');
            break;
          case 'center':
            styles.delete('htLeft');
            styles.delete('htCenter');
            styles.delete('htRight');
            styles.add('htCenter');
            break;
          case 'right':
            styles.delete('htLeft');
            styles.delete('htCenter');
            styles.delete('htRight');
            styles.add('htRight');
            break;
          case 'border-all':
            // 外枠のセルにのみ罫線を追加
            styles.delete('htBorderOuter');
            styles.delete('htBorderNone');
            styles.delete('htBorderOuterThick');
            styles.delete('htBorderBottomDouble');
            if (isTopEdge) styles.add('htBorderTop');
            if (isBottomEdge) styles.add('htBorderBottom');
            if (isLeftEdge) styles.add('htBorderLeft');
            if (isRightEdge) styles.add('htBorderRight');
            break;
          case 'border-outer':
            // 外枠のセルにのみ罫線を追加
            styles.delete('htBorderAll');
            styles.delete('htBorderNone');
            styles.delete('htBorderOuterThick');
            styles.delete('htBorderBottomDouble');
            if (isTopEdge) styles.add('htBorderTop');
            if (isBottomEdge) styles.add('htBorderBottom');
            if (isLeftEdge) styles.add('htBorderLeft');
            if (isRightEdge) styles.add('htBorderRight');
            break;
          case 'border-none':
            styles.delete('htBorderAll');
            styles.delete('htBorderOuter');
            styles.delete('htBorderTop');
            styles.delete('htBorderBottom');
            styles.delete('htBorderLeft');
            styles.delete('htBorderRight');
            styles.delete('htBorderOuterThick');
            styles.delete('htBorderBottomDouble');
            styles.add('htBorderNone');
            break;
          case 'border-top':
            // 選択範囲の上端のセルにのみ上罫線を追加
            if (isTopEdge) {
              styles.delete('htBorderAll');
              styles.delete('htBorderOuter');
              styles.delete('htBorderOuterThick');
              styles.delete('htBorderNone');
              styles.add('htBorderTop');
            }
            break;
          case 'border-bottom':
            // 選択範囲の下端のセルにのみ下罫線を追加
            if (isBottomEdge) {
              styles.delete('htBorderAll');
              styles.delete('htBorderOuter');
              styles.delete('htBorderOuterThick');
              styles.delete('htBorderNone');
              styles.add('htBorderBottom');
            }
            break;
          case 'border-left':
            // 選択範囲の左端のセルにのみ左罫線を追加
            if (isLeftEdge) {
              styles.delete('htBorderAll');
              styles.delete('htBorderOuter');
              styles.delete('htBorderOuterThick');
              styles.delete('htBorderNone');
              styles.add('htBorderLeft');
            }
            break;
          case 'border-right':
            // 選択範囲の右端のセルにのみ右罫線を追加
            if (isRightEdge) {
              styles.delete('htBorderAll');
              styles.delete('htBorderOuter');
              styles.delete('htBorderOuterThick');
              styles.delete('htBorderNone');
              styles.add('htBorderRight');
            }
            break;
          case 'border-outer-thick':
            // 外枠のセルにのみ太い罫線を追加
            styles.delete('htBorderAll');
            styles.delete('htBorderOuter');
            styles.delete('htBorderNone');
            styles.delete('htBorderTop');
            styles.delete('htBorderBottom');
            styles.delete('htBorderLeft');
            styles.delete('htBorderRight');
            styles.delete('htBorderBottomDouble');
            styles.delete('htBorderTopBottom');
            if (isTopEdge || isBottomEdge || isLeftEdge || isRightEdge) {
              styles.add('htBorderOuterThick');
            }
            break;
          case 'border-bottom-double':
            // 選択範囲の下端のセルにのみ二重下罫線を追加
            if (isBottomEdge) {
              styles.delete('htBorderAll');
              styles.delete('htBorderOuter');
              styles.delete('htBorderOuterThick');
              styles.delete('htBorderNone');
              styles.delete('htBorderBottom');
              styles.delete('htBorderTopBottom');
              styles.add('htBorderBottomDouble');
            }
            break;
          case 'border-top-bottom':
            // 選択範囲の上端と下端のセルに罫線を追加
            styles.delete('htBorderAll');
            styles.delete('htBorderOuter');
            styles.delete('htBorderOuterThick');
            styles.delete('htBorderNone');
            styles.delete('htBorderBottomDouble');
            if (isTopEdge) styles.add('htBorderTop');
            if (isBottomEdge) styles.add('htBorderBottom');
            break;
        }

        cellStylesRef.current.set(cellKey, styles);

        // HandsontableのsetCellMetaを使ってスタイル情報を保存
        const currentMeta = hot.getCellMeta(row, col);
        hot.setCellMeta(row, col, 'customStyles', Array.from(styles));
      }
    }

    hot.render();
    
    // ボタンの状態を更新（現在選択されているセルの書式を反映）
    const currentSelection = hot.getSelected();
    if (currentSelection && currentSelection.length > 0) {
      const [row, col] = currentSelection[0];
      const cellKey = `${row},${col}`;
      const styles = cellStylesRef.current.get(cellKey);
      
      if (styles) {
        setIsBold(styles.has('htBold'));
        setIsItalic(styles.has('htItalic'));
        setIsUnderline(styles.has('htUnderline'));
      } else {
        setIsBold(false);
        setIsItalic(false);
        setIsUnderline(false);
      }
    }
    
    onLogEvent({
      eventType: 'TOOLBAR_ACTION',
      timestamp: Date.now(),
      data: { action: `style_${style}` },
    });
  };

  const applyNumberFormat = (format: string) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected || selected.length === 0) return;

    const [row1, col1, row2, col2] = selected[0];
    const startRow = Math.min(row1, row2);
    const endRow = Math.max(row1, row2);
    const startCol = Math.min(col1, col2);
    const endCol = Math.max(col1, col2);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const value = hot.getDataAtCell(row, col);
        const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
        
        if (!isNaN(numValue)) {
          let formattedValue = '';
          switch (format) {
            case 'currency':
              formattedValue = `¥${numValue.toLocaleString('ja-JP')}`;
              break;
            case 'percent':
              formattedValue = `${(numValue * 100).toFixed(0)}%`;
              break;
            case 'comma':
              formattedValue = numValue.toLocaleString('ja-JP');
              break;
          }
          hot.setDataAtCell(row, col, formattedValue, 'edit');
        }
      }
    }

    onLogEvent({
      eventType: 'TOOLBAR_ACTION',
      timestamp: Date.now(),
      data: { action: `format_${format}` },
    });
  };

  const insertRow = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (selected) {
      const [row] = selected[0];
      hot.alter('insert_row_above', row);
      onLogEvent({
        eventType: 'TOOLBAR_ACTION',
        timestamp: Date.now(),
        data: { action: 'insert_row', row },
      });
    }
  };

  const deleteRow = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (selected) {
      const [row] = selected[0];
      hot.alter('remove_row', row);
      onLogEvent({
        eventType: 'TOOLBAR_ACTION',
        timestamp: Date.now(),
        data: { action: 'delete_row', row },
      });
    }
  };

  // カスタムレンダラー: classNameとインラインスタイルを適用
  const customRenderer = (instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any, cellProperties: any) => {
    // デフォルトのテキストレンダラーを使用
    Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);

    // cellPropertiesからclassNameを取得してTD要素に適用
    if (cellProperties.className) {
      td.className = cellProperties.className;
    }

    // cellPropertiesからカスタムスタイルを取得
    const customStyles = cellProperties.customStyles;
    if (customStyles && Array.isArray(customStyles)) {
      const styles = new Set(customStyles);

      // 罫線スタイルをインラインスタイルとして適用（CSSよりも優先度が高い）
      if (styles.has('htBorderTop')) {
        td.style.borderTop = '2px solid #000';
        td.style.borderTopWidth = '2px';
        td.style.borderTopStyle = 'solid';
        td.style.borderTopColor = '#000';
      }
      if (styles.has('htBorderBottom')) {
        td.style.borderBottom = '2px solid #000';
        td.style.borderBottomWidth = '2px';
        td.style.borderBottomStyle = 'solid';
        td.style.borderBottomColor = '#000';
      }
      if (styles.has('htBorderLeft')) {
        td.style.borderLeft = '2px solid #000';
        td.style.borderLeftWidth = '2px';
        td.style.borderLeftStyle = 'solid';
        td.style.borderLeftColor = '#000';
      }
      if (styles.has('htBorderRight')) {
        td.style.borderRight = '2px solid #000';
        td.style.borderRightWidth = '2px';
        td.style.borderRightStyle = 'solid';
        td.style.borderRightColor = '#000';
      }
      if (styles.has('htBorderAll')) {
        td.style.border = '2px solid #000';
        td.style.borderWidth = '2px';
        td.style.borderStyle = 'solid';
        td.style.borderColor = '#000';
      }
      if (styles.has('htBorderOuter')) {
        td.style.border = '2px solid #000';
        td.style.borderWidth = '2px';
        td.style.borderStyle = 'solid';
        td.style.borderColor = '#000';
      }
      if (styles.has('htBorderOuterThick')) {
        td.style.border = '4px solid #000';
        td.style.borderWidth = '4px';
        td.style.borderStyle = 'solid';
        td.style.borderColor = '#000';
      }
      if (styles.has('htBorderBottomDouble')) {
        td.style.borderBottom = '3px double #000';
        td.style.borderBottomWidth = '3px';
        td.style.borderBottomStyle = 'double';
        td.style.borderBottomColor = '#000';
      }
      if (styles.has('htBorderNone')) {
        td.style.border = '1px solid #D4D4D4';
        td.style.borderWidth = '1px';
        td.style.borderStyle = 'solid';
        td.style.borderColor = '#D4D4D4';
      }
    }
  };

  // シート切り替えハンドラー
  const handleSheetChange = (index: number) => {
    if (index === activeSheetIndex) return;
    
    // 現在のシートのスタイルを保存
    const updatedSheets = [...sheets];
    updatedSheets[activeSheetIndex].cellStyles = new Map(cellStylesRef.current);
    
    // 新しいシートに切り替え
    setActiveSheetIndex(index);
    cellStylesRef.current = updatedSheets[index].cellStyles;
    setSheets(updatedSheets);
    
    // Handsontableをリフレッシュ
    setTimeout(() => {
      const hot = hotRef.current?.hotInstance;
      if (hot) {
        hot.loadData(updatedSheets[index].data.slice(1));
        hot.render();
      }
    }, 0);
    
    onLogEvent({
      eventType: 'TOOLBAR_ACTION',
      timestamp: Date.now(),
      data: { action: 'switch_sheet', sheetName: updatedSheets[index].name },
    });
  };
  
  // 新しいシート追加ハンドラー
  // 昇順・降順の並べ替え
  const handleSort = (order: 'asc' | 'desc') => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected || selected.length === 0) {
      alert('並べ替えたい列のセルを選択してください');
      return;
    }

    const [row, col] = selected[0];

    // 行番号列（A列、col=0）は並べ替え不可
    if (col === 0) {
      alert('行番号列は並べ替えできません');
      return;
    }

    // シートデータから直接取得（hot.getData()は表示範囲のみなので使わない）
    const currentSheet = sheets[activeSheetIndex];

    // フィルターが有効な場合は2行目以降（データヘッダーを除く）、無効な場合は1行目以降
    const startIndex = isFilterEnabled ? 2 : 1;
    const currentData = currentSheet.data.slice(startIndex);

    console.log('Sort - Total rows in sheet:', currentSheet.data.length);
    console.log('Sort - Current data rows:', currentData.length);

    // 空白行を除外（行番号列以外のすべてのセルが空白の行）
    const filteredData = currentData.filter((row: any[]) => {
      return row.slice(1).some((cell: any) => cell !== null && cell !== undefined && cell !== '');
    });

    console.log('Sort - Filtered data rows:', filteredData.length);

    // データをインデックスと一緒に配列に格納
    const dataWithIndex = filteredData.map((row: any[], index: number) => ({
      row,
      originalIndex: index,
      cellStyles: new Map<string, Set<string>>() // 各行のセルスタイルを保存
    }));

    // 各行のセルスタイルを保存（tableData内での行インデックスを使用）
    dataWithIndex.forEach((item, arrayIndex) => {
      // tableData内での実際の行番号
      const actualRowIndex = arrayIndex;
      for (let colIndex = 0; colIndex < item.row.length; colIndex++) {
        const cellKey = `${actualRowIndex},${colIndex}`;
        const styles = cellStylesRef.current.get(cellKey);
        if (styles) {
          item.cellStyles.set(`${colIndex}`, new Set(styles));
        }
      }
    });

    // フィルターが無効な場合、1行目（データヘッダー）は並べ替えない
    let headerRow = null;
    let sortableData = dataWithIndex;

    if (!isFilterEnabled && dataWithIndex.length > 0) {
      headerRow = dataWithIndex[0];
      sortableData = dataWithIndex.slice(1);
    }

    // 並べ替え
    sortableData.sort((a, b) => {
      const aValue = a.row[col];
      const bValue = b.row[col];

      // 数値として比較できる場合は数値比較
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return order === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // 文字列として比較
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');

      if (order === 'asc') {
        return aStr.localeCompare(bStr, 'ja');
      } else {
        return bStr.localeCompare(aStr, 'ja');
      }
    });

    // 並べ替え後のデータを再構築
    const sortedData = headerRow ? [headerRow, ...sortableData] : sortableData;

    // 行番号を再設定（A列）
    sortedData.forEach((item, index) => {
      if (isFilterEnabled) {
        // フィルター有効時：データは2から始まる（CSVの3行目以降がtableData）
        item!.row[0] = String(index + 2);
      } else {
        // フィルター無効時：0行目はデータヘッダー（行番号1）、1行目以降は2から
        if (index === 0) {
          item!.row[0] = '1'; // データヘッダー行
        } else {
          item!.row[0] = String(index + 1); // データ行（2から開始）
        }
      }
    });

    // 新しいセルスタイルマップを作成
    const newCellStyles = new Map<string, Set<string>>();
    sortedData.forEach((item, newRowIndex) => {
      if (item && item.cellStyles) {
        item.cellStyles.forEach((styles, colKey) => {
          const newCellKey = `${newRowIndex},${colKey}`;
          newCellStyles.set(newCellKey, styles);
        });
      }
    });

    // セルスタイルを更新
    cellStylesRef.current = newCellStyles;

    // データを更新
    const newData = sortedData.map(item => item!.row);
    hot.loadData(newData);

    // セルメタデータも更新
    newData.forEach((row: any[], rowIndex: number) => {
      row.forEach((_: any, colIndex: number) => {
        const cellKey = `${rowIndex},${colIndex}`;
        const styles = newCellStyles.get(cellKey);
        if (styles) {
          hot.setCellMeta(rowIndex, colIndex, 'customStyles', Array.from(styles));
        } else {
          hot.setCellMeta(rowIndex, colIndex, 'customStyles', []);
        }
      });
    });

    hot.render();

    // シートデータも更新
    const updatedSheets = [...sheets];
    updatedSheets[activeSheetIndex].data = newData;
    updatedSheets[activeSheetIndex].cellStyles = newCellStyles;

    console.log('Sort - After sort, sheet data rows:', updatedSheets[activeSheetIndex].data.length);
    console.log('Sort - After sort, newData rows:', newData.length);

    setSheets(updatedSheets);

    onLogEvent({
      eventType: 'TOOLBAR_ACTION',
      timestamp: Date.now(),
      data: { action: 'sort', order, column: col },
    });
  };

  const handleAddSheet = () => {
    const newSheetNumber = sheets.length + 1;
    const columnCount = data[0]?.length || 27;
    const newSheet: Sheet = {
      id: `sheet${newSheetNumber}`,
      name: `Sheet${newSheetNumber}`,
      data: [
        data[0], // ヘッダーをコピー（A, B, C, ..., AA）
        data[1], // 1行目：列ラベルをコピー（'1', 'ID', '氏名', ...）
        ...Array(500).fill(null).map((_, rowIndex) => {
          const row = Array(columnCount).fill('');
          // A列（0列目）には行番号を設定（2から開始）
          row[0] = String(rowIndex + 2);
          return row;
        })
      ],
      cellStyles: new Map(),
      spillRanges: [],
      cellFormulas: new Map(),
    };
    setSheets([...sheets, newSheet]);

    onLogEvent({
      eventType: 'TOOLBAR_ACTION',
      timestamp: Date.now(),
      data: { action: 'add_sheet', sheetName: newSheet.name },
    });
  };
  
  // 現在のアクティブシートのデータを取得
  const currentSheet = sheets[activeSheetIndex];

  // Excel風の列ヘッダー（空白, A, B, C, D...）を生成
  const columnHeaders = useMemo(() => {
    const numCols = currentSheet.data[0]?.length || 26;
    return Array.from({ length: numCols }, (_, i) => {
      if (i === 0) return ''; // 最初の列（行番号列）は空白
      let col = '';
      let num = i - 1; // A列はインデックス1なので-1
      while (num >= 0) {
        col = String.fromCharCode(65 + (num % 26)) + col;
        num = Math.floor(num / 26) - 1;
      }
      return col;
    });
  }, [currentSheet.data]);

  // テーブルデータは全データをそのまま使用
  const tableData = currentSheet.data;

  // activeSheetIndexが変更されたときにcellStylesRefを更新
  useEffect(() => {
    cellStylesRef.current = sheets[activeSheetIndex].cellStyles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSheetIndex]);

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

  // 枠線メニューの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (borderMenuRef.current && !borderMenuRef.current.contains(event.target as Node)) {
        setShowBorderMenu(false);
      }
    };

    if (showBorderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBorderMenu]);

  // スピル機能: セルがスピル範囲内かチェック
  const isSpilledCell = (row: number, col: number): SpillRange | null => {
    const currentSpillRanges = sheets[activeSheetIndex].spillRanges;
    for (const range of currentSpillRanges) {
      if (
        row >= range.originRow &&
        row < range.originRow + range.rows &&
        col >= range.originCol &&
        col < range.originCol + range.cols
      ) {
        return range;
      }
    }
    return null;
  };

  // スピル機能: セルがスピルの起点かチェック
  const isSpillOrigin = (row: number, col: number): boolean => {
    const currentSpillRanges = sheets[activeSheetIndex].spillRanges;
    return currentSpillRanges.some(
      range => range.originRow === row && range.originCol === col
    );
  };

  // スピル機能: スピル可能かチェック（隣接セルが空か）
  const canSpill = (
    startRow: number,
    startCol: number,
    rows: number,
    cols: number
  ): boolean => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return false;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // 開始セル以外をチェック
        if (r !== 0 || c !== 0) {
          const cell = hot.getDataAtCell(startRow + r, startCol + c);
          if (cell !== null && cell !== '' && cell !== undefined) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // スピル機能: 既存のスピル範囲を削除
  const clearSpillRange = (row: number, col: number) => {
    const updatedSheets = [...sheets];
    const currentSpillRanges = updatedSheets[activeSheetIndex].spillRanges;

    // この起点からのスピル範囲を見つける
    const rangeIndex = currentSpillRanges.findIndex(
      range => range.originRow === row && range.originCol === col
    );

    if (rangeIndex >= 0) {
      const range = currentSpillRanges[rangeIndex];
      const hot = hotRef.current?.hotInstance;

      // スピルされたセルをクリア（起点以外）
      if (hot) {
        for (let r = 0; r < range.rows; r++) {
          for (let c = 0; c < range.cols; c++) {
            if (r !== 0 || c !== 0) {
              hot.setDataAtCell(range.originRow + r, range.originCol + c, '', 'loadData');
            }
          }
        }
      }

      // スピル範囲を削除
      currentSpillRanges.splice(rangeIndex, 1);
      setSheets(updatedSheets);
    }
  };

  // スピル保護: 変更前にチェック
  const handleBeforeChange = (
    changes: (Handsontable.CellChange | null)[],
    source: Handsontable.ChangeSource
  ) => {
    if (!changes || source === 'loadData' || (source as string) === 'spill') {
      return; // loadDataとspillソースは常に許可
    }

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      if (!change) continue;

      const [row, col, oldValue, newValue] = change;

      if (typeof row === 'number' && typeof col === 'number') {
        // このセルがスピル範囲内かチェック
        const spillRange = isSpilledCell(row, col);

        if (spillRange) {
          // スピルの起点以外は編集不可
          if (spillRange.originRow !== row || spillRange.originCol !== col) {
            console.log(`[Spill] Blocked edit to spilled cell (${row}, ${col})`);
            changes.splice(i, 1);
            i--;

            // エラーメッセージを表示（オプション）
            if (hotRef.current?.hotInstance) {
              const hot = hotRef.current.hotInstance;
              const originalValue = hot.getDataAtCell(row, col);
              hot.setDataAtCell(row, col, originalValue, 'loadData');
            }
          } else {
            // 起点セルが編集または削除される場合、beforeChangeではスピル範囲をクリアするのみ
            // （数式の削除とシート状態の更新はafterChangeで行う）
            console.log(`[Spill] Origin cell edited, clearing spill range`);
            const hot = hotRef.current?.hotInstance;
            if (hot) {
              // スピル範囲を見つける
              const currentSpillRanges = sheets[activeSheetIndex].spillRanges;
              const range = currentSpillRanges.find(
                r => r.originRow === row && r.originCol === col
              );

              if (range) {
                // スピルされたセルをクリア（起点以外）
                for (let r = 0; r < range.rows; r++) {
                  for (let c = 0; c < range.cols; c++) {
                    if (r !== 0 || c !== 0) {
                      hot.setDataAtCell(range.originRow + r, range.originCol + c, '', 'loadData');
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const handleAfterChange = (
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ) => {
    if (!changes || source === 'loadData' || (source as string) === 'spill') return;

    // 現在のシートのデータを更新（変更されたセルのみ）
    const updatedSheets = [...sheets];

    changes.forEach(([row, col, oldValue, newValue]) => {
      // tableDataでの行インデックスをシートデータでの行インデックスに変換
      // フィルター有効時：tableData[0] = sheetData[2]（0:columnHeaders, 1:dataHeaders, 2-:data）
      // フィルター無効時：tableData[0] = sheetData[1]（0:columnHeaders, 1-:data）
      const sheetRowIndex = isFilterEnabled ? row + 2 : row + 1;

      if (typeof col === 'number') {
        // 数式の検出と評価
        if (typeof newValue === 'string' && newValue.trim().startsWith('=')) {
          // 数式を評価
          try {
            // 行番号列（0列目）を除外したデータを数式エンジンに渡す
            const dataWithoutRowNumbers = updatedSheets[activeSheetIndex].data.map(row => row.slice(1));

            const result = evaluateFormula(
              newValue,
              dataWithoutRowNumbers,
              sheetRowIndex,
              col - 1  // 列インデックスも調整（行番号列を除外）
            );

            // 結果が2次元配列かチェック（スピル対象）
            const is2DArray = Array.isArray(result) &&
                              result.length > 0 &&
                              Array.isArray(result[0]);

            if (is2DArray) {
              // スピル処理
              const spillRows = result.length;
              const spillCols = result[0].length;

              console.log(`[Spill] Detected 2D array result: ${spillRows}x${spillCols}`);

              // スピル可能かチェック
              if (canSpill(row, col, spillRows, spillCols)) {
                console.log('[Spill] Can spill - setting values');

                // 既存のスピル範囲をクリア（同じ起点から）
                clearSpillRange(row, col);

                // スピル範囲を登録
                updatedSheets[activeSheetIndex].spillRanges.push({
                  originRow: row,
                  originCol: col,
                  rows: spillRows,
                  cols: spillCols,
                });

                // 数式を保存（起点セルのみ）
                const cellKey = `${row},${col}`;
                updatedSheets[activeSheetIndex].cellFormulas.set(cellKey, newValue);

                // 各セルに値を設定
                const hot = hotRef.current?.hotInstance;
                if (hot) {
                  for (let r = 0; r < spillRows; r++) {
                    for (let c = 0; c < spillCols; c++) {
                      const targetRow = row + r;
                      const targetCol = col + c;
                      const targetSheetRow = isFilterEnabled ? targetRow + 2 : targetRow + 1;
                      const value = result[r][c];

                      // シートデータを更新
                      if (!updatedSheets[activeSheetIndex].data[targetSheetRow]) {
                        updatedSheets[activeSheetIndex].data[targetSheetRow] = [];
                      }
                      updatedSheets[activeSheetIndex].data[targetSheetRow][targetCol] = value;

                      // Handsontableに反映（'spill'ソースを使用）
                      hot.setDataAtCell(targetRow, targetCol, value, 'spill');
                    }
                  }
                }

                // ログイベント
                onLogEvent({
                  eventType: 'FORMULA_INPUT',
                  timestamp: Date.now(),
                  data: {
                    row,
                    col,
                    formula: newValue,
                    result: `Spilled: ${spillRows}x${spillCols} array`,
                    oldValue: oldValue as string,
                  },
                });
              } else {
                // スピル不可：#SPILL!エラー
                console.log('[Spill] Cannot spill - blocked');
                updatedSheets[activeSheetIndex].data[sheetRowIndex][col] = '#SPILL!';
                if (hotRef.current?.hotInstance) {
                  hotRef.current.hotInstance.setDataAtCell(row, col, '#SPILL!', 'loadData');
                }
              }
            } else {
              // 通常の結果（スカラー値または文字列）
              updatedSheets[activeSheetIndex].data[sheetRowIndex][col] = result;

              // 数式を保存
              const cellKey = `${row},${col}`;
              updatedSheets[activeSheetIndex].cellFormulas.set(cellKey, newValue);

              // ログイベント
              onLogEvent({
                eventType: 'FORMULA_INPUT',
                timestamp: Date.now(),
                data: {
                  row,
                  col,
                  formula: newValue,
                  result,
                  oldValue: oldValue as string,
                },
              });

              // Handsontableに結果を反映
              if (hotRef.current?.hotInstance) {
                hotRef.current.hotInstance.setDataAtCell(row, col, result, 'loadData');
              }
            }
          } catch (error) {
            console.error('Formula evaluation error:', error);
            updatedSheets[activeSheetIndex].data[sheetRowIndex][col] = '#ERROR';
          }
        } else {
          // 通常のセルデータを更新
          if (updatedSheets[activeSheetIndex].data[sheetRowIndex]) {
            updatedSheets[activeSheetIndex].data[sheetRowIndex][col] = newValue;
          }

          // セルを削除する場合、保存されている数式とスピル範囲も削除
          if (newValue === null || newValue === '') {
            const cellKey = `${row},${col}`;

            // 数式を削除
            updatedSheets[activeSheetIndex].cellFormulas.delete(cellKey);

            // スピル範囲を削除（このセルが起点の場合）
            const spillRanges = updatedSheets[activeSheetIndex].spillRanges;
            const spillIndex = spillRanges.findIndex(
              range => range.originRow === row && range.originCol === col
            );
            if (spillIndex >= 0) {
              console.log(`[Spill] Removing spill range for cell (${row}, ${col})`);
              spillRanges.splice(spillIndex, 1);
            }
          }

          // 通常のセル編集イベント
          onLogEvent({
            eventType: 'CELL_EDIT',
            timestamp: Date.now(),
            data: {
              row,
              col,
              oldValue: oldValue as string,
              newValue: newValue as string,
            },
          });
        }
      }
    });

    // シートデータを保存
    setSheets(updatedSheets);
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

  const handleAfterCopy = (data: any[][], coords: any[]) => {
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

  const handleAfterSelection = (
    row: number,
    column: number,
    row2: number,
    column2: number
  ) => {
    // セル参照を更新（例: A1, B2など）
    const colLetter = String.fromCharCode(65 + column);
    const cellRef = `${colLetter}${row + 1}`;
    setSelectedCell(cellRef);

    // 選択されたセルの値または数式を数式バーに表示
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      const cellKey = `${row},${column}`;
      // 数式が保存されている場合は数式を表示、そうでなければ値を表示
      const formula = sheets[activeSheetIndex].cellFormulas.get(cellKey);
      if (formula) {
        setFormulaBarValue(formula);
      } else {
        const cellValue = hot.getDataAtCell(row, column);
        setFormulaBarValue(cellValue || '');
      }

      // cellStylesRefからセルの書式状態を取得してボタンの状態を更新
      const styles = cellStylesRef.current.get(cellKey);

      if (styles) {
        setIsBold(styles.has('htBold'));
        setIsItalic(styles.has('htItalic'));
        setIsUnderline(styles.has('htUnderline'));
      } else {
        setIsBold(false);
        setIsItalic(false);
        setIsUnderline(false);
      }
    }
  };

  // 数式バーでEnterキーが押されたときの処理
  const handleFormulaBarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitFormulaBarValue();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // セルの現在値に戻す
      const hot = hotRef.current?.hotInstance;
      if (hot) {
        const selected = hot.getSelected();
        if (selected && selected.length > 0) {
          const [row, col] = selected[0];
          const cellKey = `${row},${col}`;
          const formula = sheets[activeSheetIndex].cellFormulas.get(cellKey);
          if (formula) {
            setFormulaBarValue(formula);
          } else {
            const cellValue = hot.getDataAtCell(row, col);
            setFormulaBarValue(cellValue || '');
          }
        }
      }
    }
  };

  // 数式バーの値をセルに反映
  const commitFormulaBarValue = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected || selected.length === 0) return;

    const [row, col] = selected[0];

    // A列（行番号列）は編集不可
    if (col === 0) return;

    // 数式バーの値をセルに設定
    hot.setDataAtCell(row, col, formulaBarValue, 'edit');
  };

  const ribbonTabs = [
    'ファイル',
    'ホーム',
    '挿入',
    'ページレイアウト',
    '数式',
    'データ',
    '校閲',
    '表示',
    '自動化',
    'ヘルプ',
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* トップバー - Excel風のタブメニュー */}
      <div className="border-b border-gray-300 bg-white">
        <div className="flex items-center px-2 py-1">
          {/* Excelアイコンとブック名 */}
          <div className="flex items-center space-x-2 mr-4">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">📊</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">Book1</span>
            <span className="text-gray-400">📋</span>
          </div>

          {/* リボンタブ */}
          <div className="flex space-x-1">
            {ribbonTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveRibbonTab(tab)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeRibbonTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* 右側のアイコン */}
          <div className="ml-auto flex items-center space-x-2">
            <button className="p-1 hover:bg-gray-100 rounded">
              <span className="text-gray-600">💬</span>
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <span className="text-gray-600">📤</span>
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <span className="text-gray-600">👤</span>
            </button>
          </div>
        </div>

        {/* リボンツールバー - タブごとの内容 */}
        {activeRibbonTab === 'ファイル' && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-2">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center">
                <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  保存
                </button>
              </div>
              <div className="flex flex-col items-center">
                <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  名前を付けて保存
                </button>
              </div>
              <div className="flex flex-col items-center">
                <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  開く
                </button>
              </div>
              <div className="flex flex-col items-center">
                <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  印刷
                </button>
              </div>
              <div className="flex flex-col items-center">
                <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  情報
                </button>
              </div>
            </div>
          </div>
        )}

        {activeRibbonTab === 'ホーム' && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-2">
            <div className="flex items-center space-x-4">
              {/* クリップボード */}
              <div className="flex flex-col items-center border-r border-gray-300 pr-4">
                <div className="flex space-x-1">
                  <button 
                    className="p-1 hover:bg-gray-200 rounded" 
                    title="貼り付け"
                    onClick={handlePaste}
                  >
                    <span className="text-xl">📋</span>
                  </button>
                  <button 
                    className="p-1 hover:bg-gray-200 rounded" 
                    title="切り取り"
                    onClick={handleCut}
                  >
                    <span className="text-xl">✂️</span>
                  </button>
                  <button 
                    className="p-1 hover:bg-gray-200 rounded" 
                    title="コピー"
                    onClick={handleCopy}
                  >
                    <span className="text-xl">📄</span>
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">クリップボード</span>
              </div>

              {/* フォント */}
              <div className="flex flex-col border-r border-gray-300 pr-4">
                <div className="flex items-center space-x-2">
                  <select className="text-sm border border-gray-300 rounded px-2 py-1">
                    <option>游ゴシック</option>
                    <option>Arial</option>
                    <option>Times New Roman</option>
                  </select>
                  <select className="text-sm border border-gray-300 rounded px-2 py-1 w-16">
                    <option>11</option>
                    <option>12</option>
                    <option>14</option>
                  </select>
                  <button 
                    className={`p-1 hover:bg-gray-200 rounded font-bold ${isBold ? 'bg-blue-200 border border-blue-400' : ''}`}
                    title="太字"
                    onClick={() => applyCellStyle('bold')}
                  >
                    B
                  </button>
                  <button 
                    className={`p-1 hover:bg-gray-200 rounded italic ${isItalic ? 'bg-blue-200 border border-blue-400' : ''}`}
                    title="斜体"
                    onClick={() => applyCellStyle('italic')}
                  >
                    I
                  </button>
                  <button 
                    className={`p-1 hover:bg-gray-200 rounded underline ${isUnderline ? 'bg-blue-200 border border-blue-400' : ''}`}
                    title="下線"
                    onClick={() => applyCellStyle('underline')}
                  >
                    U
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">フォント</span>
              </div>

              {/* 配置 */}
              <div className="flex flex-col border-r border-gray-300 pr-4">
                <div className="flex items-center space-x-1">
                  <button 
                    className="p-1 hover:bg-gray-200 rounded" 
                    title="左揃え"
                    onClick={() => applyCellStyle('left')}
                  >
                    <span className="text-sm">⬅</span>
                  </button>
                  <button 
                    className="p-1 hover:bg-gray-200 rounded" 
                    title="中央揃え"
                    onClick={() => applyCellStyle('center')}
                  >
                    <span className="text-sm">↔</span>
                  </button>
                  <button 
                    className="p-1 hover:bg-gray-200 rounded" 
                    title="右揃え"
                    onClick={() => applyCellStyle('right')}
                  >
                    <span className="text-sm">➡</span>
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">配置</span>
              </div>

              {/* 枠線 */}
              <div className="flex flex-col border-r border-gray-300 pr-4 relative" ref={borderMenuRef}>
                <div className="flex items-center space-x-1">
                  <button 
                    className="p-1 hover:bg-gray-200 rounded flex items-center" 
                    title="枠線"
                    onClick={() => setShowBorderMenu(!showBorderMenu)}
                  >
                    <span className="text-sm">⊞</span>
                    <span className="text-xs ml-0.5">▼</span>
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">枠線</span>
                
                {/* 枠線ドロップダウンメニュー */}
                {showBorderMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 shadow-lg rounded z-[9999] p-2 w-64">
                    {/* 枠線パターン選択グリッド */}
                    <div className="grid grid-cols-5 gap-1 mb-2 pb-2 border-b border-gray-200">
                      <button
                        className="p-2 hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-center"
                        title="下罫線"
                        onClick={() => {
                          applyCellStyle('border-bottom');
                          setShowBorderMenu(false);
                        }}
                      >
                        <div className="w-6 h-6 border-b-2 border-black"></div>
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-center"
                        title="上罫線"
                        onClick={() => {
                          applyCellStyle('border-top');
                          setShowBorderMenu(false);
                        }}
                      >
                        <div className="w-6 h-6 border-t-2 border-black"></div>
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-center"
                        title="左罫線"
                        onClick={() => {
                          applyCellStyle('border-left');
                          setShowBorderMenu(false);
                        }}
                      >
                        <div className="w-6 h-6 border-l-2 border-black"></div>
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-center"
                        title="右罫線"
                        onClick={() => {
                          applyCellStyle('border-right');
                          setShowBorderMenu(false);
                        }}
                      >
                        <div className="w-6 h-6 border-r-2 border-black"></div>
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-center"
                        title="罫線なし"
                        onClick={() => {
                          applyCellStyle('border-none');
                          setShowBorderMenu(false);
                        }}
                      >
                        <div className="w-6 h-6"></div>
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-center"
                        title="すべての罫線"
                        onClick={() => {
                          applyCellStyle('border-all');
                          setShowBorderMenu(false);
                        }}
                      >
                        <div className="w-6 h-6 border-2 border-black grid grid-cols-2 grid-rows-2">
                          <div className="border-r border-b border-black"></div>
                          <div className="border-b border-black"></div>
                          <div className="border-r border-black"></div>
                          <div></div>
                        </div>
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-center"
                        title="外枠"
                        onClick={() => {
                          applyCellStyle('border-outer');
                          setShowBorderMenu(false);
                        }}
                      >
                        <div className="w-6 h-6 border-2 border-black"></div>
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-center"
                        title="外枠太線"
                        onClick={() => {
                          applyCellStyle('border-outer-thick');
                          setShowBorderMenu(false);
                        }}
                      >
                        <div className="w-6 h-6 border-4 border-black"></div>
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-center"
                        title="下二重罫線"
                        onClick={() => {
                          applyCellStyle('border-bottom-double');
                          setShowBorderMenu(false);
                        }}
                      >
                        <div className="w-6 h-6 relative">
                          <div className="absolute bottom-0 w-full border-b-2 border-black"></div>
                          <div className="absolute bottom-1 w-full border-b border-black"></div>
                        </div>
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-center"
                        title="上下罫線"
                        onClick={() => {
                          applyCellStyle('border-top-bottom');
                          setShowBorderMenu(false);
                        }}
                      >
                        <div className="w-6 h-6 border-t-2 border-b-2 border-black"></div>
                      </button>
                    </div>
                    
                    {/* メニューオプション */}
                    <div className="space-y-1">
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center"
                        onClick={() => setShowBorderMenu(false)}
                      >
                        <span className="mr-2">✏️</span> 罫線の描画
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center"
                        onClick={() => setShowBorderMenu(false)}
                      >
                        <span className="mr-2">⊞</span> 罫線グリッドの描画
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center"
                        onClick={() => {
                          applyCellStyle('border-none');
                          setShowBorderMenu(false);
                        }}
                      >
                        <span className="mr-2">🗑️</span> 罫線の消去
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center justify-between"
                        onClick={() => setShowBorderMenu(false)}
                      >
                        <span className="flex items-center">
                          <span className="mr-2">🎨</span> 罫線の色
                        </span>
                        <span>›</span>
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center justify-between"
                        onClick={() => setShowBorderMenu(false)}
                      >
                        <span className="flex items-center">
                          <span className="mr-2">📏</span> 罫線の種類
                        </span>
                        <span>›</span>
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center"
                        onClick={() => setShowBorderMenu(false)}
                      >
                        <span className="mr-2">⚙️</span> その他の罫線スタイル
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 数値 */}
              <div className="flex flex-col border-r border-gray-300 pr-4">
                <div className="flex items-center space-x-1">
                  <button 
                    className="p-1 hover:bg-gray-200 rounded text-sm" 
                    title="通貨"
                    onClick={() => applyNumberFormat('currency')}
                  >
                    ¥
                  </button>
                  <button 
                    className="p-1 hover:bg-gray-200 rounded text-sm" 
                    title="パーセント"
                    onClick={() => applyNumberFormat('percent')}
                  >
                    %
                  </button>
                  <button 
                    className="p-1 hover:bg-gray-200 rounded text-sm" 
                    title="桁区切り"
                    onClick={() => applyNumberFormat('comma')}
                  >
                    ,
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">数値</span>
              </div>

              {/* セル */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <button 
                    className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
                    onClick={insertRow}
                  >
                    挿入
                  </button>
                  <button 
                    className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
                    onClick={deleteRow}
                  >
                    削除
                  </button>
                  <button className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    書式
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">セル</span>
              </div>
            </div>
          </div>
        )}

        {activeRibbonTab === '挿入' && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-2">
            <div className="flex items-center space-x-4">
              {/* テーブル */}
              <div className="flex flex-col items-center border-r border-gray-300 pr-4">
                <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  📊 テーブル
                </button>
                <span className="text-xs text-gray-600 mt-1">テーブル</span>
              </div>

              {/* 図 */}
              <div className="flex flex-col border-r border-gray-300 pr-4">
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    🖼️ 画像
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    ⬜ 図形
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">図</span>
              </div>

              {/* グラフ */}
              <div className="flex flex-col border-r border-gray-300 pr-4">
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    📈 縦棒
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    📉 折れ線
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    🥧 円
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">グラフ</span>
              </div>

              {/* リンク */}
              <div className="flex flex-col">
                <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  🔗 リンク
                </button>
                <span className="text-xs text-gray-600 mt-1">リンク</span>
              </div>
            </div>
          </div>
        )}

        {activeRibbonTab === 'ページレイアウト' && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-2">
            <div className="flex items-center space-x-4">
              {/* テーマ */}
              <div className="flex flex-col items-center border-r border-gray-300 pr-4">
                <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  🎨 テーマ
                </button>
                <span className="text-xs text-gray-600 mt-1">テーマ</span>
              </div>

              {/* ページ設定 */}
              <div className="flex flex-col border-r border-gray-300 pr-4">
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    余白
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    印刷の向き
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    サイズ
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">ページ設定</span>
              </div>

              {/* 拡大縮小 */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    幅
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    高さ
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">拡大縮小</span>
              </div>
            </div>
          </div>
        )}

        {activeRibbonTab === '数式' && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-2">
            <div className="flex items-center space-x-4">
              {/* 関数の挿入 */}
              <div className="flex flex-col items-center border-r border-gray-300 pr-4">
                <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  𝑓ₓ 関数の挿入
                </button>
                <span className="text-xs text-gray-600 mt-1">関数ライブラリ</span>
              </div>

              {/* 関数カテゴリ */}
              <div className="flex flex-col border-r border-gray-300 pr-4">
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    SUM
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    平均
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    COUNT
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    IF
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">よく使う関数</span>
              </div>

              {/* 計算 */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    計算方法
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    再計算
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">計算オプション</span>
              </div>
            </div>
          </div>
        )}

        {activeRibbonTab === 'データ' && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-2">
            <div className="flex items-center space-x-4">
              {/* 並べ替えとフィルター */}
              <div className="flex flex-col border-r border-gray-300 pr-4">
                <div className="flex items-center space-x-1">
                  <button
                    className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200"
                    onClick={() => handleSort('asc')}
                  >
                    ⬆️ 昇順
                  </button>
                  <button
                    className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200"
                    onClick={() => handleSort('desc')}
                  >
                    ⬇️ 降順
                  </button>
                  <button
                    className={`px-3 py-2 text-sm border rounded hover:bg-gray-200 ${isFilterEnabled ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                    onClick={() => {
                      setIsFilterEnabled(!isFilterEnabled);
                      onLogEvent({
                        eventType: 'TOOLBAR_ACTION',
                        timestamp: Date.now(),
                        data: { action: 'toggle_filter', enabled: !isFilterEnabled },
                      });
                    }}
                  >
                    🔽 フィルター
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">並べ替えとフィルター</span>
              </div>

              {/* データツール */}
              <div className="flex flex-col border-r border-gray-300 pr-4">
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    区切り位置
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    重複の削除
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">データツール</span>
              </div>

              {/* アウトライン */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    グループ化
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    小計
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">アウトライン</span>
              </div>
            </div>
          </div>
        )}

        {activeRibbonTab === '校閲' && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-2">
            <div className="flex items-center space-x-4">
              {/* コメント */}
              <div className="flex flex-col items-center border-r border-gray-300 pr-4">
                <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  💬 新しいコメント
                </button>
                <span className="text-xs text-gray-600 mt-1">コメント</span>
              </div>

              {/* 保護 */}
              <div className="flex flex-col border-r border-gray-300 pr-4">
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    🔒 シートの保護
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    🔐 ブックの保護
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">保護</span>
              </div>

              {/* 変更履歴 */}
              <div className="flex flex-col">
                <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  📝 変更履歴の記録
                </button>
                <span className="text-xs text-gray-600 mt-1">変更履歴</span>
              </div>
            </div>
          </div>
        )}

        {activeRibbonTab === '表示' && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-2">
            <div className="flex items-center space-x-4">
              {/* ブックの表示 */}
              <div className="flex flex-col border-r border-gray-300 pr-4">
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    標準
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    改ページプレビュー
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    ページレイアウト
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">ブックの表示</span>
              </div>

              {/* 表示 */}
              <div className="flex flex-col border-r border-gray-300 pr-4">
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    ☑️ 数式バー
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    ☑️ 見出し
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    ☑️ 目盛線
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">表示</span>
              </div>

              {/* ズーム */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    🔍 ズーム
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                    100%
                  </button>
                </div>
                <span className="text-xs text-gray-600 mt-1">ズーム</span>
              </div>
            </div>
          </div>
        )}

        {activeRibbonTab === '自動化' && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-2">
            <div className="flex items-center space-x-4">
              {/* マクロ */}
              <div className="flex flex-col items-center border-r border-gray-300 pr-4">
                <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  ▶️ マクロの記録
                </button>
                <span className="text-xs text-gray-600 mt-1">マクロ</span>
              </div>

              {/* Visual Basic */}
              <div className="flex flex-col">
                <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  💻 Visual Basic
                </button>
                <span className="text-xs text-gray-600 mt-1">コード</span>
              </div>
            </div>
          </div>
        )}

        {activeRibbonTab === 'ヘルプ' && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-2">
            <div className="flex items-center space-x-4">
              {/* ヘルプ */}
              <div className="flex flex-col items-center border-r border-gray-300 pr-4">
                <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  ❓ ヘルプ
                </button>
                <span className="text-xs text-gray-600 mt-1">ヘルプ</span>
              </div>

              {/* フィードバック */}
              <div className="flex flex-col">
                <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-200">
                  💭 フィードバック
                </button>
                <span className="text-xs text-gray-600 mt-1">フィードバック</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 数式バー */}
      <div className="border-b border-gray-300 bg-white px-2 py-2">
        <div className="flex items-center space-x-2">
          <div className="w-20 border border-gray-300 rounded px-2 py-1 text-sm font-medium text-gray-700">
            {selectedCell}
          </div>
          <div className="flex-1 flex items-center border border-gray-300 rounded">
            <span className="px-2 text-gray-600 font-mono">𝑓ₓ</span>
            <input
              type="text"
              value={formulaBarValue}
              onChange={(e) => setFormulaBarValue(e.target.value)}
              onKeyDown={handleFormulaBarKeyDown}
              placeholder="数式を入力"
              className="flex-1 px-2 py-1 text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* スプレッドシートエリア */}
      <div className="flex-1 bg-white" style={{ height: '600px' }}>
        <HotTable
          key={`sheet-${activeSheetIndex}-${isFilterEnabled}`}
          ref={hotRef}
          data={tableData}
          colHeaders={columnHeaders}
          rowHeaders={false}
          width="100%"
          height="100%"
          licenseKey="non-commercial-and-evaluation"
          autoRowSize={false}
          autoColumnSize={false}
          renderAllRows={true}
          colWidths={Array(27).fill(100).map((width, i) => {
            // 列ごとに幅を調整
            if (i === 0) return 50;  // No列（行番号）
            if (i === 1) return 60;  // ID列
            if (i === 2) return 140; // 氏名列
            if (i === 3) return 100; // 部署列
            if (i === 4) return 100; // 役職列
            if (i === 5) return 80;  // 入社年列
            return 100; // G-AA列は100px
          })}
          columns={Array(27).fill(null).map((_, i) => ({
            data: i,
            type: 'text',
            renderer: customRenderer
          }))}
          cells={function(row, col) {
            const cellProperties: any = {};
            const cellKey = `${row},${col}`;
            const styles = cellStylesRef.current.get(cellKey);

            // A列（0列目）は読み取り専用の行番号
            if (col === 0) {
              cellProperties.readOnly = true;
              cellProperties.className = 'htMiddle htCenter';
              return cellProperties;
            }

            // デフォルトのクラス名を設定
            let classNames = ['htMiddle'];
            // 入社年列（列5）は右揃え
            if (col === 5) {
              classNames.push('htRight');
            }

            // スピルセルのスタイル
            const spillRange = isSpilledCell(row, col);
            if (spillRange) {
              if (spillRange.originRow === row && spillRange.originCol === col) {
                classNames.push('spill-origin');
                cellProperties.readOnly = false; // 起点は編集可能
              } else {
                classNames.push('spill-cell');
                cellProperties.readOnly = true; // スピルされたセルは読み取り専用
              }
            }

            // エラーセルのスタイル（#で始まるセル値）
            const cellValue = this.instance.getDataAtCell(row, col);
            if (typeof cellValue === 'string' && cellValue.startsWith('#')) {
              classNames.push('error-cell');
            }

            // cellStylesRefから保存されているスタイルを追加
            if (styles) {
              styles.forEach(style => classNames.push(style));
              // customStylesメタデータも設定
              cellProperties.customStyles = Array.from(styles);
            }

            cellProperties.className = classNames.join(' ');
            return cellProperties;
          }}
          filters={isFilterEnabled}
          dropdownMenu={isFilterEnabled ? {
            items: {
              filter_by_condition: {},
              filter_by_value: {},
              filter_action_bar: {},
            },
          } : false}
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
          beforeChange={handleBeforeChange}
          afterChange={handleAfterChange}
          afterFilter={handleAfterFilter}
          afterCopy={handleAfterCopy}
          afterSelection={handleAfterSelection}
          stretchH="all"
          autoWrapRow={false}
          autoWrapCol={false}
          manualColumnResize={true}
          manualRowResize={true}
          manualColumnMove={false}
          manualRowMove={false}
          selectionMode="multiple"
          outsideClickDeselects={false}
          preventOverflow="horizontal"
          className="htMiddle"
        />
      </div>

      {/* シートタブ - Excelスタイル */}
      <div className="border-t border-gray-300 bg-white px-2 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {/* シート切り替えボタン */}
            <button className="p-1 hover:bg-gray-100 rounded" title="前のシートへ">
              <span className="text-gray-600 text-xs">◀</span>
            </button>
            <button className="p-1 hover:bg-gray-100 rounded" title="次のシートへ">
              <span className="text-gray-600 text-xs">▶</span>
            </button>
            
            {/* シートタブリスト */}
            <div className="flex items-center space-x-0.5 ml-2 border-b border-gray-300">
              {sheets.map((sheet, index) => (
                <button
                  key={sheet.id}
                  onClick={() => handleSheetChange(index)}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    index === activeSheetIndex
                      ? 'bg-white text-gray-900 border-t border-l border-r border-gray-300 -mb-px z-10'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-b border-gray-300'
                  }`}
                  style={index === activeSheetIndex ? { borderBottom: '2px solid white' } : {}}
                >
                  {sheet.name}
                </button>
              ))}
              
              {/* 新規シート追加ボタン */}
              <button
                onClick={handleAddSheet}
                className="px-3 py-2 text-lg text-gray-600 hover:bg-gray-100 border-b border-gray-300 transition-colors"
                title="新しいシートを追加"
              >
                ➕
              </button>
            </div>
          </div>
          
          {/* 右側のコントロール */}
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <button className="hover:underline">標準</button>
            <span>|</span>
            <button className="hover:underline">ズーム 100%</button>
          </div>
        </div>
      </div>
    </div>
  );
}
