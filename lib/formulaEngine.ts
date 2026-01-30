/**
 * カスタム数式エンジン - Phase 1: 基本関数
 * Excel風の関数をサポート
 */

// 列名をインデックスに変換（例: "A" -> 0, "B" -> 1, "AA" -> 26）
function columnToIndex(col: string): number | null {
  if (!col || !/^[A-Z]+$/.test(col)) return null;
  return col.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

// セル参照をパース（例: "B2" -> {row: 1, col: 1}）
function parseCellRef(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const col = columnToIndex(match[1]);
  const row = parseInt(match[2]) - 1;

  if (col === null) return null;
  return { row, col };
}

// 範囲参照をパース（例: "B2:B5" -> [{row: 1, col: 1}, ...]）
function parseRange(range: string, data: any[][]): any[] {
  const [start, end] = range.split(':');
  const startCell = parseCellRef(start);
  const endCell = parseCellRef(end);

  if (!startCell || !endCell) return [];

  const values: any[] = [];
  for (let row = startCell.row; row <= endCell.row; row++) {
    for (let col = startCell.col; col <= endCell.col; col++) {
      if (data[row] && data[row][col] !== undefined) {
        values.push(data[row][col]);
      }
    }
  }

  return values;
}

// 範囲参照を2次元配列として取得（VLOOKUPなど用）
function parseRange2D(range: string, data: any[][]): any[][] {
  const [start, end] = range.split(':');
  const startCell = parseCellRef(start);
  const endCell = parseCellRef(end);

  if (!startCell || !endCell) return [];

  const result: any[][] = [];
  for (let row = startCell.row; row <= endCell.row; row++) {
    const rowData: any[] = [];
    for (let col = startCell.col; col <= endCell.col; col++) {
      if (data[row] && data[row][col] !== undefined) {
        rowData.push(data[row][col]);
      } else {
        rowData.push('');
      }
    }
    result.push(rowData);
  }

  return result;
}

// 数値に変換（文字列の数値も変換）
function toNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

// 配列対応ラッパー: 関数を配列の各要素に適用
function makeArrayCapable(func: Function): Function {
  return function(...args: any[]) {
    // 引数に配列があるかチェック
    const hasArray = args.some(arg => Array.isArray(arg));

    if (!hasArray) {
      // 配列がない場合は通常の呼び出し
      return func(...args);
    }

    // 配列の最大長を取得
    const maxLength = Math.max(
      ...args.map(arg => Array.isArray(arg) ? arg.length : 1)
    );

    // 各要素に関数を適用して2次元配列として返す（スピル機能用）
    const result = [];
    for (let i = 0; i < maxLength; i++) {
      const mappedArgs = args.map(arg =>
        Array.isArray(arg) ? (arg[i] ?? '') : arg
      );

      try {
        result.push([func(...mappedArgs)]); // 各結果を配列でラップ（列ベクトル）
      } catch (e) {
        // エラーの場合はfalseまたはエラー値を返す
        result.push([false]);
      }
    }

    return result; // [[value1], [value2], ...] の2次元配列
  };
}

// ===== Phase 1: 基本関数 =====

// 数学・統計関数
export function SUM(...args: any[]): number {
  const numbers = args.flat().map(toNumber);
  return numbers.reduce((sum, num) => sum + num, 0);
}

export function AVERAGE(...args: any[]): number {
  if (args.length === 0 || args.flat().length === 0) {
    throw new Error('#VALUE!');
  }
  const numbers = args.flat().map(toNumber);
  return SUM(...numbers) / numbers.length;
}

export function COUNT(...args: any[]): number {
  const numbers = args.flat().filter(v => typeof v === 'number' || !isNaN(parseFloat(v)));
  return numbers.length;
}

export function MAX(...args: any[]): number {
  if (args.length === 0 || args.flat().length === 0) {
    throw new Error('#VALUE!');
  }
  const numbers = args.flat().map(toNumber);
  return Math.max(...numbers);
}

export function MIN(...args: any[]): number {
  if (args.length === 0 || args.flat().length === 0) {
    throw new Error('#VALUE!');
  }
  const numbers = args.flat().map(toNumber);
  return Math.min(...numbers);
}

export function ROUND(num: any, digits: number = 0): number {
  if (num === undefined || num === null) {
    throw new Error('#VALUE!');
  }
  const n = toNumber(num);
  const multiplier = Math.pow(10, digits);
  return Math.round(n * multiplier) / multiplier;
}

// 論理関数
export function IF(condition: any, trueValue: any, falseValue: any): any {
  if (condition === undefined || trueValue === undefined || falseValue === undefined) {
    throw new Error('#VALUE!');
  }
  return condition ? trueValue : falseValue;
}

export function IFS(...args: any[]): any {
  if (args.length === 0 || args.length % 2 !== 0) {
    throw new Error('#VALUE!');
  }

  // 条件と値のペアを順番にチェック
  for (let i = 0; i < args.length; i += 2) {
    const condition = args[i];
    const value = args[i + 1];

    // 条件がtrue、1、"TRUE"の場合に値を返す
    if (condition === true || condition === 1 || String(condition).toUpperCase() === 'TRUE') {
      return value;
    }
  }

  // すべての条件がfalseの場合
  throw new Error('#N/A');
}

export function AND(...args: any[]): boolean {
  if (args.length === 0) {
    throw new Error('#VALUE!');
  }
  return args.every(arg => Boolean(arg));
}

export function OR(...args: any[]): boolean {
  if (args.length === 0) {
    throw new Error('#VALUE!');
  }
  return args.some(arg => Boolean(arg));
}

// 文字列関数
export function CONCATENATE(...args: any[]): string {
  if (args.length === 0) {
    throw new Error('#VALUE!');
  }
  return args.map(String).join('');
}

export function LEFT(text: string, numChars: number = 1): string {
  if (text === undefined || text === null) {
    throw new Error('#VALUE!');
  }
  return String(text).substring(0, numChars);
}

export function RIGHT(text: string, numChars: number = 1): string {
  if (text === undefined || text === null) {
    throw new Error('#VALUE!');
  }
  const str = String(text);
  return str.substring(str.length - numChars);
}

export function LEN(text: string): number {
  if (text === undefined || text === null) {
    throw new Error('#VALUE!');
  }
  return String(text).length;
}

export function TRIM(text: string): string {
  if (text === undefined || text === null) {
    throw new Error('#VALUE!');
  }
  // 前後の空白を削除し、連続する空白を1つにまとめる
  return String(text).trim().replace(/\s+/g, ' ');
}

export function UPPER(text: string): string {
  if (text === undefined || text === null) {
    throw new Error('#VALUE!');
  }
  return String(text).toUpperCase();
}

export function LOWER(text: string): string {
  if (text === undefined || text === null) {
    throw new Error('#VALUE!');
  }
  return String(text).toLowerCase();
}

// ===== Phase 2: 中級関数 =====

// 日付関数
export function TODAY(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 条件付き集計関数
export function COUNTIF(range: any[], criteria: any): number {
  if (!Array.isArray(range) || range.length === 0) {
    throw new Error('#VALUE!');
  }
  if (criteria === undefined || criteria === null) {
    throw new Error('#VALUE!');
  }

  // 条件を評価する関数を作成
  const evaluateCriteria = (value: any, criteria: any): boolean => {
    // 数値比較演算子をチェック（例: ">100", "<=50"）
    if (typeof criteria === 'string') {
      const match = criteria.match(/^(>=|<=|>|<|<>|=)(.+)$/);
      if (match) {
        const operator = match[1];
        const compareValue = toNumber(match[2]);
        const numValue = toNumber(value);
        
        switch (operator) {
          case '>': return numValue > compareValue;
          case '<': return numValue < compareValue;
          case '>=': return numValue >= compareValue;
          case '<=': return numValue <= compareValue;
          case '<>': return numValue !== compareValue;
          case '=': return numValue === compareValue;
        }
      }
      // 文字列の完全一致または部分一致（ワイルドカード対応）
      const pattern = criteria.replace(/\*/g, '.*').replace(/\?/g, '.');
      const regex = new RegExp(`^${pattern}$`, 'i');
      return regex.test(String(value));
    }
    
    // 数値や真偽値の完全一致
    return value === criteria;
  };

  return range.filter(value => evaluateCriteria(value, criteria)).length;
}

export function SUMIF(range: any[], criteria: any, sumRange?: any[]): number {
  if (!Array.isArray(range) || range.length === 0) {
    throw new Error('#VALUE!');
  }
  if (criteria === undefined || criteria === null) {
    throw new Error('#VALUE!');
  }

  // sumRangeが指定されていない場合はrangeを使用
  const actualSumRange = sumRange || range;

  // 条件を評価する関数（COUNTIFと同じロジック）
  const evaluateCriteria = (value: any, criteria: any): boolean => {
    if (typeof criteria === 'string') {
      const match = criteria.match(/^(>=|<=|>|<|<>|=)(.+)$/);
      if (match) {
        const operator = match[1];
        const compareValue = toNumber(match[2]);
        const numValue = toNumber(value);
        
        switch (operator) {
          case '>': return numValue > compareValue;
          case '<': return numValue < compareValue;
          case '>=': return numValue >= compareValue;
          case '<=': return numValue <= compareValue;
          case '<>': return numValue !== compareValue;
          case '=': return numValue === compareValue;
        }
      }
      const pattern = criteria.replace(/\*/g, '.*').replace(/\?/g, '.');
      const regex = new RegExp(`^${pattern}$`, 'i');
      return regex.test(String(value));
    }
    return value === criteria;
  };

  let sum = 0;
  for (let i = 0; i < range.length; i++) {
    if (evaluateCriteria(range[i], criteria)) {
      sum += toNumber(actualSumRange[i]);
    }
  }
  return sum;
}

// 検索関数
export function XLOOKUP(
  lookupValue: any,
  lookupArray: any[],
  returnArray: any[],
  ifNotFound?: any
): any {
  if (lookupValue === undefined || lookupValue === null) {
    throw new Error('#VALUE!');
  }
  if (!Array.isArray(lookupArray) || lookupArray.length === 0) {
    throw new Error('#VALUE!');
  }
  if (!Array.isArray(returnArray) || returnArray.length === 0) {
    throw new Error('#VALUE!');
  }

  // 配列を検索
  for (let i = 0; i < lookupArray.length; i++) {
    if (lookupArray[i] === lookupValue) {
      return returnArray[i] ?? (ifNotFound !== undefined ? ifNotFound : '#N/A');
    }
  }

  // 見つからない場合
  return ifNotFound !== undefined ? ifNotFound : '#N/A';
}

export function VLOOKUP(lookupValue: any, tableArray: any[][], colIndex: number, rangeLookup: boolean = true): any {
  if (lookupValue === undefined || lookupValue === null) {
    throw new Error('#VALUE!');
  }
  if (!Array.isArray(tableArray) || tableArray.length === 0) {
    throw new Error('#VALUE!');
  }
  if (colIndex === undefined || colIndex === null) {
    throw new Error('#VALUE!');
  }
  if (colIndex < 1 || colIndex > tableArray[0].length) {
    throw new Error('#REF!');
  }

  // 完全一致検索（rangeLookup = false）
  if (!rangeLookup) {
    for (let i = 0; i < tableArray.length; i++) {
      if (tableArray[i][0] === lookupValue) {
        return tableArray[i][colIndex - 1];
      }
    }
    return '#N/A'; // 見つからない場合
  }

  // 近似一致検索（rangeLookup = true）
  // テーブルが昇順にソートされていると仮定
  let lastMatch = -1;
  for (let i = 0; i < tableArray.length; i++) {
    const cellValue = tableArray[i][0];
    if (toNumber(cellValue) <= toNumber(lookupValue)) {
      lastMatch = i;
    } else {
      break;
    }
  }

  if (lastMatch >= 0) {
    return tableArray[lastMatch][colIndex - 1];
  }
  return '#N/A'; // 見つからない場合
}

// エラー処理関数
export function IFERROR(value: any, valueIfError: any): any {
  if (value === undefined) {
    throw new Error('#VALUE!');
  }
  // エラー値をチェック
  // 1. 文字列のエラー（#ERROR, #N/A, #DIV/0! など）
  if (typeof value === 'string' && value.startsWith('#')) {
    return valueIfError;
  }
  // 2. 数値のエラー（NaN, Infinity）
  if (typeof value === 'number' && (!isFinite(value) || isNaN(value))) {
    return valueIfError;
  }
  return value;
}

// ===== Phase 3: 高度な関数 =====

// 日付関数（拡張）
export function DATE(year: number, month: number, day: number): string {
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error('#VALUE!');
  }
  const y = Math.floor(toNumber(year));
  const m = Math.floor(toNumber(month));
  const d = Math.floor(toNumber(day));
  
  // JavaScriptのDateオブジェクトを使用（月は0始まり）
  const date = new Date(y, m - 1, d);
  const yearStr = date.getFullYear();
  const monthStr = String(date.getMonth() + 1).padStart(2, '0');
  const dayStr = String(date.getDate()).padStart(2, '0');
  return `${yearStr}-${monthStr}-${dayStr}`;
}

export function YEAR(dateStr: string): number {
  if (dateStr === undefined || dateStr === null) {
    throw new Error('#VALUE!');
  }
  const date = new Date(String(dateStr));
  if (isNaN(date.getTime())) {
    throw new Error('#VALUE!');
  }
  return date.getFullYear();
}

export function MONTH(dateStr: string): number {
  if (dateStr === undefined || dateStr === null) {
    throw new Error('#VALUE!');
  }
  const date = new Date(String(dateStr));
  if (isNaN(date.getTime())) {
    throw new Error('#VALUE!');
  }
  return date.getMonth() + 1;
}

export function DAY(dateStr: string): number {
  if (dateStr === undefined || dateStr === null) {
    throw new Error('#VALUE!');
  }
  const date = new Date(String(dateStr));
  if (isNaN(date.getTime())) {
    throw new Error('#VALUE!');
  }
  return date.getDate();
}

export function DATEDIF(startDate: string, endDate: string, unit: string): number {
  if (startDate === undefined || endDate === undefined || unit === undefined) {
    throw new Error('#VALUE!');
  }

  const start = new Date(String(startDate));
  const end = new Date(String(endDate));

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('#VALUE!');
  }
  
  const unitUpper = String(unit).toUpperCase();
  
  switch (unitUpper) {
    case 'D': // Days
      return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    case 'M': // Months
      return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    case 'Y': // Years
      return end.getFullYear() - start.getFullYear();
    case 'MD': // Days ignoring months and years
      return end.getDate() - start.getDate();
    case 'YM': // Months ignoring years
      return end.getMonth() - start.getMonth();
    case 'YD': // Days ignoring years
      const startThisYear = new Date(end.getFullYear(), start.getMonth(), start.getDate());
      return Math.floor((end.getTime() - startThisYear.getTime()) / (1000 * 60 * 60 * 24));
    default:
      throw new Error('#VALUE!');
  }
}

// 高度な条件付き集計関数
export function COUNTIFS(...args: any[]): number {
  if (args.length < 2 || args.length % 2 !== 0) {
    throw new Error('COUNTIFS requires pairs of range and criteria');
  }
  
  // 範囲と条件のペアを抽出
  const pairs: Array<{ range: any[], criteria: any }> = [];
  for (let i = 0; i < args.length; i += 2) {
    if (!Array.isArray(args[i])) {
      throw new Error('#VALUE!');
    }
    pairs.push({ range: args[i], criteria: args[i + 1] });
  }
  
  // 最初の範囲の長さを基準にする
  const length = pairs[0].range.length;
  
  // 条件評価関数（COUNTIFと同じロジック）
  const evaluateCriteria = (value: any, criteria: any): boolean => {
    if (typeof criteria === 'string') {
      const match = criteria.match(/^(>=|<=|>|<|<>|=)(.+)$/);
      if (match) {
        const operator = match[1];
        const compareValue = toNumber(match[2]);
        const numValue = toNumber(value);
        
        switch (operator) {
          case '>': return numValue > compareValue;
          case '<': return numValue < compareValue;
          case '>=': return numValue >= compareValue;
          case '<=': return numValue <= compareValue;
          case '<>': return numValue !== compareValue;
          case '=': return numValue === compareValue;
        }
      }
      const pattern = criteria.replace(/\*/g, '.*').replace(/\?/g, '.');
      const regex = new RegExp(`^${pattern}$`, 'i');
      return regex.test(String(value));
    }
    return value === criteria;
  };
  
  // すべての条件を満たす行をカウント
  let count = 0;
  for (let i = 0; i < length; i++) {
    let allMatch = true;
    for (const pair of pairs) {
      if (i >= pair.range.length || !evaluateCriteria(pair.range[i], pair.criteria)) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) {
      count++;
    }
  }
  
  return count;
}

export function SUMIFS(sumRange: any[], ...args: any[]): number {
  if (!Array.isArray(sumRange)) {
    throw new Error('#VALUE!');
  }
  if (args.length < 2 || args.length % 2 !== 0) {
    throw new Error('#VALUE!');
  }
  
  // 範囲と条件のペアを抽出
  const pairs: Array<{ range: any[], criteria: any }> = [];
  for (let i = 0; i < args.length; i += 2) {
    if (!Array.isArray(args[i])) {
      throw new Error('#VALUE!');
    }
    pairs.push({ range: args[i], criteria: args[i + 1] });
  }
  
  // 条件評価関数
  const evaluateCriteria = (value: any, criteria: any): boolean => {
    if (typeof criteria === 'string') {
      const match = criteria.match(/^(>=|<=|>|<|<>|=)(.+)$/);
      if (match) {
        const operator = match[1];
        const compareValue = toNumber(match[2]);
        const numValue = toNumber(value);
        
        switch (operator) {
          case '>': return numValue > compareValue;
          case '<': return numValue < compareValue;
          case '>=': return numValue >= compareValue;
          case '<=': return numValue <= compareValue;
          case '<>': return numValue !== compareValue;
          case '=': return numValue === compareValue;
        }
      }
      const pattern = criteria.replace(/\*/g, '.*').replace(/\?/g, '.');
      const regex = new RegExp(`^${pattern}$`, 'i');
      return regex.test(String(value));
    }
    return value === criteria;
  };
  
  // すべての条件を満たす行を合計
  let sum = 0;
  for (let i = 0; i < sumRange.length; i++) {
    let allMatch = true;
    for (const pair of pairs) {
      if (i >= pair.range.length || !evaluateCriteria(pair.range[i], pair.criteria)) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) {
      sum += toNumber(sumRange[i]);
    }
  }
  
  return sum;
}

// 高度な検索関数
export function INDEX(array: any[] | any[][], rowNum: number, colNum?: number): any {
  if (!Array.isArray(array)) {
    throw new Error('#VALUE!');
  }
  if (rowNum === undefined) {
    throw new Error('#VALUE!');
  }
  
  const row = Math.floor(toNumber(rowNum));
  
  // 1次元配列の場合
  if (!Array.isArray(array[0])) {
    if (row < 1 || row > array.length) {
      throw new Error('#REF!');
    }
    return array[row - 1];
  }
  
  // 2次元配列の場合
  if (row < 1 || row > array.length) {
    throw new Error('#REF!');
  }
  
  // 列番号が指定されていない場合は行全体を返す
  if (colNum === undefined) {
    return array[row - 1];
  }
  
  const col = Math.floor(toNumber(colNum));
  if (col < 1 || col > array[row - 1].length) {
    throw new Error('#REF!');
  }
  
  return array[row - 1][col - 1];
}

export function MATCH(lookupValue: any, lookupArray: any[], matchType: number = 1): number {
  if (lookupValue === undefined || !Array.isArray(lookupArray)) {
    throw new Error('#VALUE!');
  }
  
  const type = matchType === undefined ? 1 : Math.floor(toNumber(matchType));
  
  if (type === 0) {
    // 完全一致
    for (let i = 0; i < lookupArray.length; i++) {
      if (lookupArray[i] === lookupValue) {
        return i + 1; // 1-based index
      }
    }
    throw new Error('#N/A');
  } else if (type === 1) {
    // 以下の最大値（配列が昇順にソート済みと仮定）
    let lastMatch = -1;
    for (let i = 0; i < lookupArray.length; i++) {
      if (toNumber(lookupArray[i]) <= toNumber(lookupValue)) {
        lastMatch = i;
      } else {
        break;
      }
    }
    if (lastMatch < 0) {
      throw new Error('#N/A');
    }
    return lastMatch + 1;
  } else if (type === -1) {
    // 以上の最小値（配列が降順にソート済みと仮定）
    for (let i = 0; i < lookupArray.length; i++) {
      if (toNumber(lookupArray[i]) >= toNumber(lookupValue)) {
        return i + 1;
      }
    }
    throw new Error('#N/A');
  }
  
  throw new Error('#VALUE!');
}

// SHOWDATA関数: データのサンプルを表示（デバッグ用）
export function SHOWDATA(array: any[][], maxRows: number = 5): string {
  if (!Array.isArray(array)) {
    return 'Not an array';
  }
  const preview = array.slice(0, maxRows).map(row =>
    Array.isArray(row) ? row.join(' | ') : String(row)
  ).join('\n');
  return `${array.length}行のデータ:\n${preview}`;
}

// SEARCH関数: テキスト内で文字列を検索（大文字小文字を区別しない）
export function SEARCH(findText: string, withinText: string, startNum: number = 1): number {
  if (findText === undefined || withinText === undefined) {
    throw new Error('#VALUE!');
  }

  const find = String(findText).toLowerCase();
  const within = String(withinText).toLowerCase();
  const start = Math.max(1, Math.floor(toNumber(startNum)));

  const index = within.indexOf(find, start - 1);
  if (index === -1) {
    throw new Error('#VALUE!');
  }

  return index + 1; // 1-based index
}

// ISNUMBER関数: 値が数値かどうかを判定
export function ISNUMBER(value: any): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  return !isNaN(Number(value)) && typeof value !== 'boolean';
}

// UNIQUE関数: 配列から重複を除いた値を返す
export function UNIQUE(array: any[] | any[][], byCol: boolean = false): string {
  if (!Array.isArray(array)) {
    throw new Error('#VALUE!');
  }

  // 配列を平坦化（2次元配列の場合）
  const flatArray = Array.isArray(array[0])
    ? array.flat()
    : array;

  // 重複を除去
  const unique = Array.from(new Set(flatArray)).filter(v => v !== '' && v !== null && v !== undefined);

  // 文字列化して返す（スピル未実装のため）
  return `[${unique.length}個の固有値]\n` + unique.join('\n');
}

// FILTER関数: 条件に合う行をフィルタリング
// 2引数版（標準）: FILTER(array, conditions) - 条件配列がtrue の行を抽出
// 3引数版（簡易）: FILTER(array, searchText, searchColumn) - 検索列から文字列を含む行を抽出
export function FILTER(array: any[][], conditionsOrText: any[] | string, searchColumn?: any[]): any[][] {
  if (!Array.isArray(array)) {
    throw new Error('#VALUE!');
  }

  console.log('[FILTER] Called with:');
  console.log('- array length:', array.length);
  console.log('- searchText:', conditionsOrText);
  console.log('- searchColumn length:', searchColumn ? searchColumn.length : 'undefined');

  let result: any[][] = [];

  // 3引数版: 簡易検索（テキスト検索）
  if (searchColumn !== undefined && typeof conditionsOrText === 'string') {
    if (!Array.isArray(searchColumn)) {
      throw new Error('#VALUE!');
    }

    const searchText = String(conditionsOrText);
    console.log('[FILTER] Searching for:', searchText);

    for (let i = 0; i < array.length; i++) {
      const cellValue = String(searchColumn[i] || '');
      if (i < 10) {
        console.log(`[FILTER] Row ${i}: "${cellValue}" (searching for "${searchText}")`);
      }
      if (cellValue.toLowerCase().includes(searchText.toLowerCase())) {
        console.log(`[FILTER] ✓ Match found at row ${i}: "${cellValue}"`);
        result.push([...array[i]]);
      }
    }
  }
  // 2引数版: 標準（条件配列）
  else if (Array.isArray(conditionsOrText)) {
    let conditions = conditionsOrText;

    // 条件配列が2次元配列の場合（[[true], [false], ...]）、1次元化する
    if (conditions.length > 0 && Array.isArray(conditions[0])) {
      conditions = conditions.map(row => row[0]);
    }

    // 条件配列の要素が真偽値か確認
    for (let i = 0; i < Math.min(array.length, conditions.length); i++) {
      // 条件がtrue、1、"true"などの場合に含める
      if (conditions[i] === true || conditions[i] === 1 || conditions[i] === 'TRUE') {
        result.push([...array[i]]);
      }
    }
  } else {
    throw new Error('#VALUE!');
  }

  // 結果が空の場合
  console.log('[FILTER] Total matches found:', result.length);
  if (result.length === 0) {
    throw new Error('#N/A');
  }

  return result;
}

// 数式を評価
export function evaluateFormula(formula: string, data: any[][], currentRow: number, currentCol: number): any {
  // 先頭の = を削除
  const originalFormula = formula;
  formula = formula.substring(1).trim();
  console.log('[FormulaEngine] Original formula:', originalFormula);

  // 文字列をエスケープする関数（共通）
  const escapeString = (v: any): string => {
    if (typeof v === 'string') {
      // バックスラッシュと引用符をエスケープ
      return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return String(v);
  };

  // 列全体の参照を処理（例: A:E, B:B）
  formula = formula.replace(/([A-Z]+):([A-Z]+)/g, (match, col1, col2) => {
    const startCol = columnToIndex(col1);
    const endCol = columnToIndex(col2);

    if (startCol === null || endCol === null) return '[]';

    // データ全体から指定された列範囲を抽出
    const numCols = endCol - startCol + 1;
    const result: any[][] = [];

    for (let row = 0; row < data.length; row++) {
      const rowData: any[] = [];
      for (let col = startCol; col <= endCol; col++) {
        rowData.push(data[row][col] ?? '');
      }
      result.push(rowData);
    }

    // 単一列の場合は1次元配列、複数列の場合は2次元配列
    if (numCols === 1) {
      const flatValues = result.map(row => row[0]);
      return `[${flatValues.map(escapeString).join(',')}]`;
    } else {
      return `[${result.map(row =>
        `[${row.map(escapeString).join(',')}]`
      ).join(',')}]`;
    }
  });

  // 範囲参照を配列に置換（例: B2:B5 -> [value1, value2, ...]）
  // NOTE: 範囲を先に処理しないと、個別のセル参照で範囲が壊れる
  formula = formula.replace(/([A-Z]+\d+:[A-Z]+\d+)/g, (match) => {
    const [start, end] = match.split(':');
    const startCell = parseCellRef(start);
    const endCell = parseCellRef(end);

    if (!startCell || !endCell) return '[]';

    // 複数列の範囲の場合は2次元配列として処理（VLOOKUP用）
    const numCols = endCell.col - startCell.col + 1;
    if (numCols > 1) {
      const table2D = parseRange2D(match, data);
      // 2次元配列をJavaScript配列リテラルに変換
      return `[${table2D.map(row =>
        `[${row.map(escapeString).join(',')}]`
      ).join(',')}]`;
    }

    // 1列の範囲の場合は1次元配列として処理
    const values = parseRange(match, data);
    return `[${values.map(escapeString).join(',')}]`;
  });

  // セル参照を値に置換（例: B2 -> data[1][1]）
  formula = formula.replace(/([A-Z]+\d+)/g, (match) => {
    const cell = parseCellRef(match);
    if (cell && data[cell.row] && data[cell.row][cell.col] !== undefined) {
      const value = data[cell.row][cell.col];
      return escapeString(value);
    }
    return '0';
  });

  // 関数呼び出しを評価
  console.log('[FormulaEngine] Transformed formula:', formula);

  try {
    // 配列対応版の関数を作成
    const SEARCH_ARRAY = makeArrayCapable(SEARCH);
    const ISNUMBER_ARRAY = makeArrayCapable(ISNUMBER);
    const LEFT_ARRAY = makeArrayCapable(LEFT);
    const RIGHT_ARRAY = makeArrayCapable(RIGHT);
    const LEN_ARRAY = makeArrayCapable(LEN);
    const TRIM_ARRAY = makeArrayCapable(TRIM);
    const UPPER_ARRAY = makeArrayCapable(UPPER);
    const LOWER_ARRAY = makeArrayCapable(LOWER);

    // eslint-disable-next-line no-new-func
    const func = new Function(
      'SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN', 'ROUND',
      'IF', 'IFS', 'AND', 'OR',
      'CONCATENATE', 'LEFT', 'RIGHT', 'LEN', 'TRIM', 'UPPER', 'LOWER',
      'TODAY', 'COUNTIF', 'SUMIF', 'XLOOKUP', 'VLOOKUP', 'IFERROR',
      'DATE', 'YEAR', 'MONTH', 'DAY', 'DATEDIF',
      'COUNTIFS', 'SUMIFS',
      'INDEX', 'MATCH',
      'SEARCH', 'ISNUMBER', 'UNIQUE', 'FILTER', 'SHOWDATA',
      `return ${formula};`
    );

    // 配列対応版を関数呼び出しに渡す（元の関数を上書き）
    const result = func(
      SUM, AVERAGE, COUNT, MAX, MIN, ROUND,
      IF, IFS, AND, OR,
      CONCATENATE, LEFT_ARRAY, RIGHT_ARRAY, LEN_ARRAY, TRIM_ARRAY, UPPER_ARRAY, LOWER_ARRAY,
      TODAY, COUNTIF, SUMIF, XLOOKUP, VLOOKUP, IFERROR,
      DATE, YEAR, MONTH, DAY, DATEDIF,
      COUNTIFS, SUMIFS,
      INDEX, MATCH,
      SEARCH_ARRAY, ISNUMBER_ARRAY, UNIQUE, FILTER, SHOWDATA
    );

    // 数値エラーチェック
    if (typeof result === 'number') {
      if (!isFinite(result)) {
        return '#DIV/0!';
      }
      if (isNaN(result)) {
        return '#NUM!';
      }
    }

    // 2次元配列はそのまま返す（スピル機能で処理される）
    if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
      console.log('[FormulaEngine] Result is 2D array, returning for spill');
      return result;
    }

    return result;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    console.error('Original formula:', originalFormula);
    console.error('Transformed formula:', formula);
    // エラーメッセージを抽出して表示
    if (error instanceof Error) {
      return `#ERROR: ${error.message}`;
    }
    return `#ERROR`;
  }
}
