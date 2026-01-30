# クイックウィン: 短期間で実装できる改善

すぐに実装できて効果が高い改善項目

---

## 🚀 今日・明日でできる改善（1-2時間）

### 1. エラーコードの標準化

**現在**:
```typescript
throw new Error('FILTER: No results found');
```
**表示**: `#ERROR: FILTER: No results found`

**改善後**:
```typescript
throw new Error('#N/A');
```
**表示**: `#N/A`

**実装**:

```typescript
// lib/formulaEngine.ts

// すべての throw new Error() を置き換え
export function FILTER(...) {
  if (result.length === 0) {
    throw new Error('#N/A');  // ← シンプルに
  }
}

export function VLOOKUP(...) {
  for (let i = 0; i < tableArray.length; i++) {
    if (tableArray[i][0] === lookupValue) {
      return tableArray[i][colIndex - 1];
    }
  }
  throw new Error('#N/A');  // ← 統一
}

export function MATCH(...) {
  // ...
  throw new Error('#N/A');
}
```

**所要時間**: 30分
**効果**: ⭐⭐⭐⭐☆

---

### 2. ゼロ除算エラーの追加

**現在**:
```excel
=1/0
```
**表示**: `Infinity` または エラー

**改善後**:
```excel
=1/0
```
**表示**: `#DIV/0!`

**実装**:

```typescript
// lib/formulaEngine.ts

// 数式評価の最後に追加
const result = func(...);

// 数値チェック
if (typeof result === 'number') {
  if (!isFinite(result)) {
    return '#DIV/0!';
  }
  if (isNaN(result)) {
    return '#NUM!';
  }
}

return result;
```

**所要時間**: 15分
**効果**: ⭐⭐⭐☆☆

---

### 3. UPPER/LOWER関数の追加

**新機能**:
```excel
=UPPER("hello")  → "HELLO"
=LOWER("HELLO")  → "hello"
```

**実装**:

```typescript
// lib/formulaEngine.ts

export function UPPER(text: string): string {
  return String(text).toUpperCase();
}

export function LOWER(text: string): string {
  return String(text).toLowerCase();
}

// 関数マップに追加
const func = new Function(
  // ...
  'UPPER', 'LOWER',
  `return ${formula};`
);

return func(
  // ...
  UPPER, LOWER
);
```

**所要時間**: 10分
**効果**: ⭐⭐☆☆☆

---

### 4. TRIM関数の追加

**新機能**:
```excel
=TRIM("  hello  world  ")  → "hello world"
```

**実装**:

```typescript
export function TRIM(text: string): string {
  return String(text).trim().replace(/\s+/g, ' ');
}
```

**所要時間**: 5分
**効果**: ⭐⭐⭐☆☆

---

## 📅 今週中にできる改善（半日～1日）

### 5. IFS関数の追加

**新機能**:
```excel
=IFS(A1>=90, "優", A1>=60, "良", TRUE, "不可")
```

複数のIF文をネストする代わりに使える便利な関数

**実装**:

```typescript
export function IFS(...conditions: any[]): any {
  // 条件と値のペアで処理
  for (let i = 0; i < conditions.length; i += 2) {
    const condition = conditions[i];
    const value = conditions[i + 1];

    if (condition === true || condition === 1) {
      return value;
    }
  }

  throw new Error('#N/A');
}
```

**使用例**:
```excel
=IFS(B2="営業部", "Sales", B2="IT部", "Tech", B2="経理部", "Finance", TRUE, "その他")
```

**所要時間**: 30分
**効果**: ⭐⭐⭐⭐☆

---

### 6. UNIQUE関数の追加（簡易版）

**新機能**:
```excel
=UNIQUE(B:B)
```
B列の重複を除いたリストを返す

**実装**:

```typescript
export function UNIQUE(array: any[], byCol: boolean = false): string {
  const flatArray = Array.isArray(array[0])
    ? array.flat()
    : array;

  const unique = [...new Set(flatArray)];

  // 文字列化して返す（スピル未実装のため）
  return `[${unique.length}個の固有値]\n` + unique.join('\n');
}
```

**所要時間**: 1時間
**効果**: ⭐⭐⭐⭐☆

---

### 7. XLOOKUP関数の追加（簡易版）

**新機能**:
```excel
=XLOOKUP(検索値, 検索配列, 戻り配列, [見つからない場合])
```

VLOOKUPより柔軟な検索

**実装**:

```typescript
export function XLOOKUP(
  lookupValue: any,
  lookupArray: any[],
  returnArray: any[],
  ifNotFound: any = '#N/A'
): any {
  for (let i = 0; i < lookupArray.length; i++) {
    if (lookupArray[i] === lookupValue) {
      return returnArray[i] ?? ifNotFound;
    }
  }
  return ifNotFound;
}
```

**使用例**:
```excel
=XLOOKUP("037", A:A, B:B, "見つかりません")
```

**所要時間**: 1時間
**効果**: ⭐⭐⭐⭐⭐

---

### 8. エラー表示の色分け

**現在**:
```
#ERROR: ...
```
すべて同じ表示

**改善後**:
```
#DIV/0!  (赤色)
#N/A     (オレンジ色)
#VALUE!  (赤色)
```

**実装**:

```typescript
// components/ExcelLikeInterface.tsx

cells: (row: number, col: number) => {
  const value = data[row][col];

  if (typeof value === 'string' && value.startsWith('#')) {
    // エラーセルのスタイル
    return {
      className: 'error-cell',
      style: {
        color: '#DC2626',
        fontWeight: 'bold',
        backgroundColor: '#FEE2E2',
      }
    };
  }

  return {};
}
```

**所要時間**: 30分
**効果**: ⭐⭐⭐☆☆

---

## 🎯 今月中にできる改善（2-3日）

### 9. 基本的なスピル機能

**目標**: FILTER関数の結果を複数セルに展開

**実装手順**:

**Step 1**: スピル可能かチェック
```typescript
function canSpill(
  hot: Handsontable,
  startRow: number,
  startCol: number,
  rows: number,
  cols: number
): boolean {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 開始セル以外が空かチェック
      if ((r !== 0 || c !== 0)) {
        const cell = hot.getDataAtCell(startRow + r, startCol + c);
        if (cell !== null && cell !== '') {
          return false;
        }
      }
    }
  }
  return true;
}
```

**Step 2**: スピル実行
```typescript
if (Array.isArray(result) && Array.isArray(result[0])) {
  const spillRows = result.length;
  const spillCols = result[0].length;

  if (canSpill(hot, row, col, spillRows, spillCols)) {
    // 値を設定
    for (let r = 0; r < spillRows; r++) {
      for (let c = 0; c < spillCols; c++) {
        hot.setDataAtCell(row + r, col + c, result[r][c], 'spill');
      }
    }

    // 青い枠線を追加
    addSpillBorder(row, col, spillRows, spillCols);
  } else {
    hot.setDataAtCell(row, col, '#SPILL!');
  }
}
```

**Step 3**: スピルセルの保護
```typescript
beforeChange: (changes, source) => {
  if (source === 'spill') return; // スピルによる変更は許可

  for (const [row, col] of changes) {
    if (isSpilledCell(row, col) && !isOriginCell(row, col)) {
      return false; // スピルされたセルは編集不可
    }
  }
}
```

**所要時間**: 2-3日
**効果**: ⭐⭐⭐⭐⭐

---

### 10. 配列対応のSEARCH/ISNUMBER

**目標**: `=ISNUMBER(SEARCH("佐藤", B:B))` が配列を返す

**実装**:

```typescript
// 配列対応のラッパー関数
function makeArrayCapable(func: Function): Function {
  return function(...args: any[]) {
    // 引数に配列があるかチェック
    const hasArray = args.some(arg => Array.isArray(arg));

    if (!hasArray) {
      // 通常の呼び出し
      return func(...args);
    }

    // 配列の長さを取得
    const maxLength = Math.max(
      ...args.map(arg => Array.isArray(arg) ? arg.length : 1)
    );

    // 各要素に適用
    const result = [];
    for (let i = 0; i < maxLength; i++) {
      const mappedArgs = args.map(arg =>
        Array.isArray(arg) ? arg[i] : arg
      );

      try {
        result.push(func(...mappedArgs));
      } catch (e) {
        result.push(false); // エラーは false
      }
    }

    return result;
  };
}

// SEARCH, ISNUMBERを配列対応に
const SEARCH_ARRAY = makeArrayCapable(SEARCH);
const ISNUMBER_ARRAY = makeArrayCapable(ISNUMBER);
```

**所要時間**: 1日
**効果**: ⭐⭐⭐⭐☆

---

## 📊 優先度マトリックス

```
効果 ↑
  │
高│ 9.スピル機能    7.XLOOKUP
  │ 10.配列関数     5.IFS
  │
  │ 1.エラー標準化   6.UNIQUE
中│ 4.TRIM         8.色分け
  │
  │ 3.UPPER/LOWER   2.DIV/0
低│
  └─────────────────────→ 実装時間
   短(数時間)  中(1日)  長(2-3日)
```

---

## 🎯 推奨実装順序

### Week 1: 基礎固め
1. ✅ エラーコードの標準化（30分）
2. ✅ ゼロ除算エラー（15分）
3. ✅ TRIM関数（5分）
4. ✅ UPPER/LOWER関数（10分）

**合計**: 1時間
**効果**: 基本的なExcel互換性向上

---

### Week 2: 便利な関数追加
5. ✅ IFS関数（30分）
6. ✅ XLOOKUP関数（1時間）
7. ✅ UNIQUE関数（1時間）
8. ✅ エラー表示の色分け（30分）

**合計**: 3時間
**効果**: ユーザーの生産性向上

---

### Week 3-4: コア機能改善
9. ✅ 基本的なスピル機能（2-3日）
10. ✅ 配列対応の関数（1日）

**合計**: 3-4日
**効果**: Excelとの互換性が大幅向上

---

## 💡 実装のコツ

### テスト駆動開発
```typescript
// test-filter.js
const testCases = [
  {
    input: '=FILTER(A:E, "佐藤", B:B)',
    expected: /* 50行のデータ */
  },
  {
    input: '=FILTER(A:E, "存在しない", B:B)',
    expected: '#N/A'
  }
];

testCases.forEach(({ input, expected }) => {
  const result = evaluateFormula(input, data, 0, 0);
  assert.equal(result, expected);
});
```

### 段階的リファクタリング
1. まず動くコードを書く
2. テストを追加
3. リファクタリング
4. テストが通ることを確認

### ユーザーフィードバック
各機能実装後、実際のユーザーに試してもらい：
- 使いやすさ
- バグの有無
- 追加してほしい機能

を聞く

---

## 📚 次のステップ

1. **このドキュメントから1つ選ぶ**
2. **実装する**
3. **テストする**
4. **次へ進む**

小さな改善を積み重ねることで、確実にExcelに近づきます！

---

## 🎓 まとめ

- **今日できる改善**: 4項目（1時間）
- **今週できる改善**: 4項目（3時間）
- **今月できる改善**: 2項目（3-4日）

**合計**: 10項目の改善で、Excelとの互換性が大幅に向上！

すぐに始められる項目から取り組んでいきましょう！
