# Excel互換性向上ロードマップ

現在の実装をより本物のExcelに近づけるための改善計画

---

## 📊 現在の実装状況

### ✅ 実装済み
- ✓ 基本的な数式評価エンジン
- ✓ 31個の基本関数
- ✓ セル参照（A1形式）
- ✓ 範囲参照（A1:E10）
- ✓ 列全体参照（A:E, B:B）
- ✓ 基本的なエラーハンドリング
- ✓ 数式の入力と評価

### ❌ 未実装・制限事項
- ✗ 配列数式（スピル機能）
- ✗ 複数セルへの結果展開
- ✗ 動的配列関数の完全サポート
- ✗ 数式バーでの高度な編集
- ✗ 循環参照の検出
- ✗ 相対参照・絶対参照（$記号）
- ✗ 名前付き範囲
- ✗ 配列定数 `{1,2,3}`
- ✗ 構造化参照（テーブル）
- ✗ ネストされた配列関数

---

## 🎯 改善優先度

### 🔴 High Priority（スコアリングに直接影響）

#### 1. スピル機能（配列の複数セル展開）★★★★★

**現在の問題**:
```excel
=FILTER(A:E, "佐藤", B:B)
```
**現在の動作**: 単一セルに文字列化して表示
```
[結果: 50行]
037, 佐藤 誠, IT部, 係長, 2024
...
```

**期待される動作**: 複数セルに自動展開（スピル）
```
G1: 037    H1: 佐藤 誠      I1: IT部      J1: 係長    K1: 2024
G2: 069    H2: 佐藤 絢香    I2: 営業部    J2: 課長    K2: 2024
G3: 104    H3: 佐藤 里奈    I3: 製造部    J3: 課長    K3: 2011
...
```

**実装方法**:

1. **Handsontableのプラグイン拡張**
```typescript
// components/ExcelLikeInterface.tsx

// 数式評価後の処理
if (Array.isArray(result) && Array.isArray(result[0])) {
  // 2次元配列の場合、スピル領域を確保
  const spillRows = result.length;
  const spillCols = result[0].length;

  // スピル領域のセルが空かチェック
  const canSpill = checkSpillArea(row, col, spillRows, spillCols);

  if (canSpill) {
    // 複数セルに値を設定
    for (let r = 0; r < spillRows; r++) {
      for (let c = 0; c < spillCols; c++) {
        hotInstance.setDataAtCell(row + r, col + c, result[r][c]);
      }
    }

    // スピル範囲を記録（スタイル適用用）
    markSpillRange(row, col, spillRows, spillCols);
  } else {
    // スピルできない場合はエラー
    hotInstance.setDataAtCell(row, col, '#SPILL!');
  }
}
```

2. **スピル範囲の視覚化**
```typescript
// スピルされたセルに薄い青色の枠線を表示
afterRenderer: (TD: HTMLElement, row: number, col: number) => {
  if (isSpilledCell(row, col)) {
    TD.style.borderColor = '#4A90E2';
    TD.style.borderWidth = '1px';
    TD.style.borderStyle = 'dashed';
  }
}
```

3. **スピル領域の保護**
```typescript
beforeChange: (changes, source) => {
  for (const change of changes) {
    const [row, col] = change;
    if (isSpilledCell(row, col) && !isOriginCell(row, col)) {
      // スピルされたセルは編集不可
      return false;
    }
  }
}
```

**難易度**: 🔴 高
**工数**: 3-5日
**影響度**: ★★★★★

---

#### 2. 配列数式のサポート ★★★★☆

**現在の問題**:
```excel
=FILTER(A:E, ISNUMBER(SEARCH("佐藤", B:B)))
```
→ エラーまたは動作しない

**期待される動作**:
- `SEARCH("佐藤", B:B)` が配列の各要素に適用される
- `ISNUMBER(...)` が各結果に適用される
- `FILTER` が真偽値配列を受け取る

**実装方法**:

1. **配列対応関数の識別**
```typescript
// lib/formulaEngine.ts

const ARRAY_CAPABLE_FUNCTIONS = [
  'SEARCH', 'ISNUMBER', 'LEN', 'LEFT', 'RIGHT',
  'IF', 'ROUND', // 等々
];

function isArrayCapable(funcName: string): boolean {
  return ARRAY_CAPABLE_FUNCTIONS.includes(funcName);
}
```

2. **自動ブロードキャスト機能**
```typescript
// 配列引数を検出したら、関数を各要素に適用
function evaluateArrayFormula(funcName: string, args: any[]): any {
  // 配列引数があるかチェック
  const hasArrayArg = args.some(arg => Array.isArray(arg));

  if (hasArrayArg && isArrayCapable(funcName)) {
    // 最大長を取得
    const maxLength = Math.max(
      ...args.map(arg => Array.isArray(arg) ? arg.length : 1)
    );

    // 各要素に関数を適用
    const result = [];
    for (let i = 0; i < maxLength; i++) {
      const mappedArgs = args.map(arg =>
        Array.isArray(arg) ? (arg[i] ?? arg[arg.length - 1]) : arg
      );
      result.push(callFunction(funcName, mappedArgs));
    }
    return result;
  }

  // 通常の関数呼び出し
  return callFunction(funcName, args);
}
```

3. **FILTER関数の更新**
```typescript
export function FILTER(array: any[][], conditions: boolean[] | any): any[][] {
  if (!Array.isArray(conditions)) {
    throw new Error('FILTER requires boolean array as second argument');
  }

  const result: any[][] = [];
  for (let i = 0; i < Math.min(array.length, conditions.length); i++) {
    if (conditions[i] === true) {
      result.push([...array[i]]);
    }
  }

  if (result.length === 0) {
    throw new Error('#CALC!');
  }

  return result;
}
```

**難易度**: 🔴 高
**工数**: 5-7日
**影響度**: ★★★★☆

---

#### 3. 絶対参照・相対参照のサポート ★★★☆☆

**現在の問題**:
```excel
=$A$1    # 絶対参照
=$A1     # 列の絶対参照
=A$1     # 行の絶対参照
```
→ すべて無視されて相対参照として扱われる

**期待される動作**:
- セルをコピーしたときに参照が適切に調整される
- `$` がある部分は固定される

**実装方法**:

1. **参照タイプの判定**
```typescript
interface CellReference {
  col: number;
  row: number;
  colAbsolute: boolean;  // $A
  rowAbsolute: boolean;  // $1
}

function parseCellRef(ref: string): CellReference | null {
  const match = ref.match(/^(\$?)([A-Z]+)(\$?)(\d+)$/);
  if (!match) return null;

  return {
    colAbsolute: match[1] === '$',
    col: columnToIndex(match[2]),
    rowAbsolute: match[3] === '$',
    row: parseInt(match[4]) - 1,
  };
}
```

2. **コピー時の参照調整**
```typescript
function adjustReference(
  ref: CellReference,
  deltaRow: number,
  deltaCol: number
): CellReference {
  return {
    ...ref,
    row: ref.rowAbsolute ? ref.row : ref.row + deltaRow,
    col: ref.colAbsolute ? ref.col : ref.col + deltaCol,
  };
}
```

**難易度**: 🟡 中
**工数**: 2-3日
**影響度**: ★★★☆☆

---

### 🟡 Medium Priority（UX改善）

#### 4. 数式バーの実装 ★★★☆☆

**現在の問題**:
- セル内で直接編集
- 長い数式が見にくい
- 編集中のプレビューがない

**期待される動作**:
```
┌─────────────────────────────────────────────┐
│ fx │ =FILTER(A:E, ISNUMBER(SEARCH("佐藤", B:B))) │
└─────────────────────────────────────────────┘
```

**実装方法**:

```typescript
// components/FormulaBar.tsx

export function FormulaBar({
  selectedCell,
  onFormulaChange
}: FormulaBarProps) {
  const [formula, setFormula] = useState('');

  return (
    <div className="flex items-center border-b bg-white p-2">
      <span className="px-2 font-mono text-gray-500">fx</span>
      <input
        type="text"
        value={formula}
        onChange={(e) => {
          setFormula(e.target.value);
          onFormulaChange(e.target.value);
        }}
        className="flex-1 px-2 py-1 border rounded"
        placeholder="数式を入力..."
      />
    </div>
  );
}
```

**難易度**: 🟡 中
**工数**: 1-2日
**影響度**: ★★★☆☆

---

#### 5. 循環参照の検出 ★★☆☆☆

**現在の問題**:
```excel
A1: =B1
B1: =A1
```
→ スタックオーバーフローまたは無限ループ

**期待される動作**:
```
#CIRCULAR!
```

**実装方法**:

```typescript
// lib/formulaEngine.ts

const evaluationStack = new Set<string>();

export function evaluateFormula(
  formula: string,
  data: any[][],
  currentRow: number,
  currentCol: number
): any {
  const cellId = `${currentRow},${currentCol}`;

  // 循環参照チェック
  if (evaluationStack.has(cellId)) {
    throw new Error('#CIRCULAR!');
  }

  evaluationStack.add(cellId);

  try {
    // 数式評価
    const result = /* ... */;
    return result;
  } finally {
    evaluationStack.delete(cellId);
  }
}
```

**難易度**: 🟢 低
**工数**: 1日
**影響度**: ★★☆☆☆

---

#### 6. エラーハンドリングの改善 ★★★☆☆

**現在の問題**:
- エラーメッセージが統一されていない
- Excel標準のエラーコードが不完全

**期待されるエラーコード**:

| エラー | 説明 | 発生例 |
|--------|------|--------|
| `#DIV/0!` | ゼロ除算 | `=1/0` |
| `#N/A` | 該当なし | `=VLOOKUP("xxx", ...)` |
| `#VALUE!` | 型エラー | `=1+"abc"` |
| `#REF!` | 参照エラー | `=A1000000` |
| `#NAME?` | 名前エラー | `=SUMM(A1:A10)` |
| `#NUM!` | 数値エラー | `=SQRT(-1)` |
| `#NULL!` | 範囲エラー | `=SUM(A1 B1)` |
| `#SPILL!` | スピルエラー | 展開先に値がある |
| `#CALC!` | 計算エラー | 一般的なエラー |

**実装方法**:

```typescript
// lib/errors.ts

export class FormulaError extends Error {
  constructor(
    public errorCode: string,
    public description: string
  ) {
    super(errorCode);
  }
}

export const ERRORS = {
  DIV_ZERO: new FormulaError('#DIV/0!', 'Division by zero'),
  NA: new FormulaError('#N/A', 'Value not available'),
  VALUE: new FormulaError('#VALUE!', 'Wrong type of argument'),
  REF: new FormulaError('#REF!', 'Invalid cell reference'),
  NAME: new FormulaError('#NAME?', 'Unknown function name'),
  NUM: new FormulaError('#NUM!', 'Invalid numeric value'),
  NULL: new FormulaError('#NULL!', 'Invalid range intersection'),
  SPILL: new FormulaError('#SPILL!', 'Spill range is not empty'),
  CALC: new FormulaError('#CALC!', 'Calculation error'),
};
```

**難易度**: 🟡 中
**工数**: 2-3日
**影響度**: ★★★☆☆

---

### 🟢 Low Priority（高度な機能）

#### 7. 名前付き範囲 ★★☆☆☆

**期待される動作**:
```excel
売上範囲 = A1:A100
=SUM(売上範囲)
```

**実装方法**:

```typescript
// lib/namedRanges.ts

interface NamedRange {
  name: string;
  range: string;  // "A1:A100"
  scope: 'workbook' | 'sheet';
}

const namedRanges = new Map<string, NamedRange>();

export function defineNamedRange(name: string, range: string) {
  namedRanges.set(name, { name, range, scope: 'workbook' });
}

export function resolveNamedRange(name: string): string | null {
  return namedRanges.get(name)?.range ?? null;
}

// formulaEngine.ts内で
formula = formula.replace(/\b([A-Z_][A-Z0-9_]*)\b/g, (match) => {
  const range = resolveNamedRange(match);
  return range ?? match;
});
```

**難易度**: 🟡 中
**工数**: 2-3日
**影響度**: ★★☆☆☆

---

#### 8. 配列定数 ★☆☆☆☆

**期待される動作**:
```excel
=SUM({1,2,3,4,5})
=VLOOKUP("ID", {"A","B";"C","D"}, 2, FALSE)
```

**実装方法**:

```typescript
// 配列定数を解析
formula = formula.replace(/\{([^}]+)\}/g, (match, content) => {
  // セミコロンで行を分割、カンマで列を分割
  const rows = content.split(';').map(row =>
    row.split(',').map(cell => cell.trim())
  );

  // JavaScript配列リテラルに変換
  return JSON.stringify(rows);
});
```

**難易度**: 🟢 低
**工数**: 1日
**影響度**: ★☆☆☆☆

---

#### 9. 構造化参照（テーブル） ★★★☆☆

**期待される動作**:
```excel
=SUM(売上テーブル[金額])
=AVERAGE(売上テーブル[@[単価]])
```

**実装方法**:

```typescript
interface Table {
  name: string;
  range: string;
  columns: string[];
}

// テーブル定義
const tables = new Map<string, Table>();

// テーブル参照の解析
function parseTableReference(ref: string): string {
  // 売上テーブル[金額] -> A2:A100
  const match = ref.match(/(\w+)\[(@?)(\w+)\]/);
  if (!match) return ref;

  const [, tableName, thisRow, columnName] = match;
  const table = tables.get(tableName);

  if (!table) return ref;

  // 列名からセル範囲を取得
  const colIndex = table.columns.indexOf(columnName);
  // ...
}
```

**難易度**: 🔴 高
**工数**: 5-7日
**影響度**: ★★★☆☆

---

#### 10. 追加関数の実装 ★★★★☆

**Excel 365で人気の関数**:

| 関数 | 説明 | 優先度 |
|------|------|--------|
| `UNIQUE` | 重複を除去 | 高 |
| `SORT` | データを並び替え | 高 |
| `SORTBY` | 他の列を基準に並び替え | 中 |
| `SEQUENCE` | 連続した数値を生成 | 中 |
| `RANDARRAY` | 乱数配列を生成 | 低 |
| `XLOOKUP` | VLOOKUPの改良版 | 高 |
| `XMATCH` | MATCHの改良版 | 中 |
| `TEXTSPLIT` | テキストを分割 | 中 |
| `TEXTJOIN` | テキストを結合 | 中 |
| `IFS` | 複数条件のIF | 高 |
| `SWITCH` | 条件分岐 | 中 |
| `MAXIFS` | 条件付き最大値 | 中 |
| `MINIFS` | 条件付き最小値 | 中 |

**実装例（UNIQUE）**:

```typescript
export function UNIQUE(array: any[][], byCol: boolean = false): any[][] {
  const seen = new Set<string>();
  const result: any[][] = [];

  for (const row of array) {
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      result.push([...row]);
    }
  }

  if (result.length === 0) {
    throw new Error('#CALC!');
  }

  return result;
}
```

**難易度**: 🟡 中（関数ごとに異なる）
**工数**: 1-3日/関数
**影響度**: ★★★★☆

---

## 📈 実装ロードマップ

### Phase 1: コア機能（2-3週間）
1. ✅ スピル機能の実装
2. ✅ 配列数式のサポート
3. ✅ エラーハンドリングの改善

### Phase 2: UX改善（1-2週間）
4. ✅ 数式バーの実装
5. ✅ 絶対参照・相対参照
6. ✅ 循環参照の検出

### Phase 3: 関数拡張（2-3週間）
7. ✅ UNIQUE, SORT, XLOOKUP などの追加
8. ✅ IFS, SWITCH などの条件関数
9. ✅ MAXIFS, MINIFS などの集計関数

### Phase 4: 高度な機能（2-4週間）
10. ✅ 名前付き範囲
11. ✅ 配列定数
12. ✅ 構造化参照（テーブル）

---

## 🎯 最優先で実装すべき機能（Top 3）

### 1️⃣ スピル機能（配列の複数セル展開）
**理由**: FILTERなどの配列関数が本来の動作をするために必須
**影響**: ユーザーがExcelと同じ感覚で使える

### 2️⃣ 配列数式のサポート
**理由**: `=FILTER(A:E, ISNUMBER(SEARCH("佐藤", B:B)))` が動作する
**影響**: 複雑な条件フィルタリングが可能になる

### 3️⃣ UNIQUE/SORT/XLOOKUP の追加
**理由**: 現代のExcelで最も使われる関数
**影響**: データ分析能力が大幅に向上

---

## 💻 技術的な課題と解決策

### 課題1: Handsontableの制約

**問題**:
- Handsontableは本来スプレッドシートライブラリではない
- セル間の依存関係管理が弱い
- 数式の再計算が自動ではない

**解決策**:

**オプションA**: Handsontable + カスタム数式エンジン（現在の方式）
- メリット: 既存コードを活用できる
- デメリット: 複雑な機能の実装が困難

**オプションB**: HyperFormula統合
```bash
npm install hyperformula
```

```typescript
import { HyperFormula } from 'hyperformula';

const hf = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
});

// シートを追加
const sheetName = hf.addSheet('Sheet1');
const sheetId = hf.getSheetId(sheetName);

// データと数式を設定
hf.setCellContents({ sheet: sheetId, col: 0, row: 0 }, [
  ['=SUM(B1:B10)'],
]);

// 自動再計算
const result = hf.getCellValue({ sheet: sheetId, col: 0, row: 0 });
```

- メリット: Excelと完全互換、自動再計算、依存関係管理
- デメリット: 既存コードの大幅な書き換えが必要

**オプションC**: 完全なスプレッドシートライブラリに移行
- Luckysheet
- x-spreadsheet
- Jspreadsheet

**推奨**: Phase 1はオプションA、Phase 2以降でオプションBを検討

---

### 課題2: パフォーマンス

**問題**:
- 大量のデータ（1000行以上）での再計算が遅い
- 配列関数が重い

**解決策**:

1. **メモ化（キャッシュ）**
```typescript
const formulaCache = new Map<string, any>();

function evaluateFormula(formula: string, ...): any {
  const cacheKey = `${formula}:${dataHash}`;

  if (formulaCache.has(cacheKey)) {
    return formulaCache.get(cacheKey);
  }

  const result = /* 計算 */;
  formulaCache.set(cacheKey, result);
  return result;
}
```

2. **遅延評価**
```typescript
// 画面外のセルは評価しない
if (!isVisible(row, col)) {
  return LAZY_PLACEHOLDER;
}
```

3. **Web Worker での並列計算**
```typescript
const worker = new Worker('formula-worker.js');
worker.postMessage({ formula, data });
worker.onmessage = (e) => {
  updateCell(e.data.result);
};
```

---

## 📚 参考リソース

### ライブラリ
- [HyperFormula](https://handsontable.github.io/hyperformula/) - Excel互換の数式エンジン
- [Formula.js](https://formulajs.info/) - Excel関数のJavaScript実装
- [ExcelJS](https://github.com/exceljs/exceljs) - Excelファイルの読み書き

### ドキュメント
- [Excel関数リファレンス（Microsoft）](https://support.microsoft.com/ja-jp/office/excel-%E9%96%A2%E6%95%B0-%E3%82%A2%E3%83%AB%E3%83%95%E3%82%A1%E3%83%99%E3%83%83%E3%83%88%E9%A0%86-b3944572-255d-4efb-bb96-c6d90033e188)
- [動的配列とスピル機能](https://support.microsoft.com/ja-jp/office/%E5%8B%95%E7%9A%84%E9%85%8D%E5%88%97%E6%95%B0%E5%BC%8F%E3%81%A8%E3%82%B9%E3%83%94%E3%83%AB%E3%81%95%E3%82%8C%E3%81%9F%E9%85%8D%E5%88%97%E5%8B%95%E4%BD%9C-205c6b06-03ba-4151-89a1-87a7eb36e531)

---

## 🎓 まとめ

### 最小限の改善（1週間）
1. スピル機能の基本実装
2. エラーコードの統一
3. UNIQUE関数の追加

### 標準的な改善（1ヶ月）
1. 完全なスピル機能
2. 配列数式のサポート
3. 数式バーの実装
4. 10個の追加関数

### 完全なExcel互換（3ヶ月）
1. HyperFormula統合
2. すべての動的配列関数
3. 構造化参照
4. 名前付き範囲
5. 100+ 関数

**推奨アプローチ**: 段階的に実装し、各Phaseでユーザーフィードバックを収集
