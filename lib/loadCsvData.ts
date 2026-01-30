/**
 * CSVファイルを読み込んでパースする
 * @param csvUrl - CSVファイルのURL（public/配下のパス）
 * @returns 2次元配列のデータ
 */
export async function loadCsvData(csvUrl: string): Promise<string[][]> {
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rawData = parseCSV(csvText);

    // 最初の列（行番号列）を除去してExcelの列参照と一致させる
    // これにより A列=列0, B列=列1 となる
    const cleanedData = rawData.map(row => row.slice(1));

    // 最初の行（列ヘッダー: A,B,C...）も除去
    const dataWithoutColumnHeaders = cleanedData.slice(1);

    console.log('[loadCsvData] Loaded rows:', dataWithoutColumnHeaders.length);
    console.log('[loadCsvData] First row:', dataWithoutColumnHeaders[0]?.slice(0, 5));

    return dataWithoutColumnHeaders;
  } catch (error) {
    console.error('Error loading CSV:', error);
    throw error;
  }
}

/**
 * CSV文字列をパースして2次元配列に変換
 * @param csvText - CSV文字列
 * @returns 2次元配列
 */
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split('\n');

  for (const line of lines) {
    if (line.trim() === '') continue; // 空行はスキップ

    const row: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // ダブルクォートの処理
        if (insideQuotes && line[i + 1] === '"') {
          // エスケープされたダブルクォート ("")
          currentCell += '"';
          i++; // 次の文字をスキップ
        } else {
          // クォートの開始または終了
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // カンマ区切り（クォート外）
        row.push(currentCell);
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    // 最後のセルを追加
    row.push(currentCell);
    rows.push(row);
  }

  return rows;
}

/**
 * デフォルトの空データを生成（CSV読み込み失敗時のフォールバック）
 * @param rows - 行数
 * @param cols - 列数
 * @returns 空の2次元配列
 */
export function generateEmptyData(rows: number = 500, cols: number = 27): string[][] {
  const headers: string[] = [];

  // ヘッダー行（27列）
  // 1列目: 空白（行番号列）、2列目以降: A, B, C, ... Z, AA
  headers.push('');
  for (let i = 0; i < 26; i++) {
    if (i < 25) {
      headers.push(String.fromCharCode(65 + i)); // A, B, C, ... Y
    } else {
      headers.push('Z'); // 26列目
    }
  }
  headers.push('AA'); // 27列目

  const data = [headers];

  // 1行目: 列ラベル（ID、氏名など）
  const dataHeaders = ['1', 'ID', '氏名', '部署', '役職', '入社年'];
  for (let i = 6; i < cols; i++) {
    dataHeaders.push(''); // G-AA列は空白
  }
  data.push(dataHeaders);

  // 2行目以降: データ行（A列は行番号、他は空白）
  for (let i = 1; i <= rows; i++) {
    const row = [String(i + 1)]; // A列：行番号（2から開始）
    for (let j = 1; j < cols; j++) {
      row.push(''); // B-AA列：空白
    }
    data.push(row);
  }

  return data;
}
