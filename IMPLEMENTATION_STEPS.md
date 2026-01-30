# 段階的実装ガイド

順番に実装していく具体的な手順

---

## 📋 実装チェックリスト

### Phase 1: 今日できる改善（合計1時間）

- [ ] **Step 1**: エラーコード統一（30分）
- [ ] **Step 2**: ゼロ除算エラー（15分）
- [ ] **Step 3**: TRIM関数追加（5分）
- [ ] **Step 4**: UPPER/LOWER関数追加（10分）

### Phase 2: 今週できる改善（合計3時間）

- [ ] **Step 5**: IFS関数追加（30分）
- [ ] **Step 6**: XLOOKUP関数追加（1時間）
- [ ] **Step 7**: UNIQUE関数追加（1時間）
- [ ] **Step 8**: エラー表示の色分け（30分）

### Phase 3: 今月できる改善（合計3-4日）

- [ ] **Step 9**: 基本的なスピル機能（2-3日）
- [ ] **Step 10**: 配列対応関数（1日）

---

## 🚀 実装開始！

---

## Step 1: エラーコード統一（30分）⭐⭐⭐⭐⭐

### 目標
`#ERROR: メッセージ` → `#N/A`, `#DIV/0!` 等のExcel標準エラーに統一

### 実装箇所
`lib/formulaEngine.ts`

### 変更内容

#### 1-1. FILTER関数のエラー修正
```typescript
// 検索: throw new Error('FILTER: No results found
// 置換:

throw new Error('#N/A');
```

**場所**: 約665行目

#### 1-2. VLOOKUP関数のエラー修正
```typescript
// 検索: throw new Error('VLOOKUP: Value not found');
// 置換:

throw new Error('#N/A');
```

**場所**: 約290行目付近

#### 1-3. MATCH関数のエラー修正
```typescript
// 検索: throw new Error('#N/A');
// これはすでに正しい！そのまま
```

#### 1-4. SEARCH関数のエラー修正
```typescript
// 検索: throw new Error('#VALUE!');
// これもすでに正しい！
```

#### 1-5. その他のエラー統一
```typescript
// lib/formulaEngine.ts 全体で検索・置換

// パターン1: 長いエラーメッセージ
throw new Error('FILTER requires array arguments');
  ↓
throw new Error('#VALUE!');

// パターン2: 引数エラー
throw new Error('COUNTIF requires at least 2 arguments');
  ↓
throw new Error('#VALUE!');

// パターン3: 範囲エラー
throw new Error('INDEX column number out of range');
  ↓
throw new Error('#REF!');
```

### テスト方法
```excel
=FILTER(A:E, "存在しない名前", B:B)  → #N/A
=VLOOKUP("999", A:B, 2, FALSE)      → #N/A
=1/0                                 → #DIV/0!（次のステップで対応）
```

### 完了確認
- [ ] FILTERで見つからない場合: `#N/A`
- [ ] VLOOKUPで見つからない場合: `#N/A`
- [ ] エラーメッセージが短くシンプル

---

## Step 2: ゼロ除算エラー（15分）⭐⭐⭐☆☆

### 目標
`=1/0` → `#DIV/0!`

### 実装箇所
`lib/formulaEngine.ts`

### 変更内容

#### 2-1. 結果チェック関数の追加
```typescript
// lib/formulaEngine.ts
// evaluateFormula関数内、return result; の直前に追加

    const result = func(
      SUM, AVERAGE, COUNT, MAX, MIN, ROUND,
      IF, AND, OR,
      CONCATENATE, LEFT, RIGHT, LEN,
      TODAY, COUNTIF, SUMIF, VLOOKUP, IFERROR,
      DATE, YEAR, MONTH, DAY, DATEDIF,
      COUNTIFS, SUMIFS,
      INDEX, MATCH,
      SEARCH, ISNUMBER, FILTER, SHOWDATA
    );

    // ========== ここに追加 ==========
    // 数値エラーチェック
    if (typeof result === 'number') {
      if (!isFinite(result)) {
        return '#DIV/0!';
      }
      if (isNaN(result)) {
        return '#NUM!';
      }
    }
    // ========== ここまで ==========

    // FILTER関数の結果（2次元配列）を文字列化
    if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
```

### テスト方法
```excel
=1/0         → #DIV/0!
=10/2        → 5
=SQRT(-1)    → #NUM!（SQRTを実装していれば）
```

### 完了確認
- [ ] `=1/0` で `#DIV/0!` が表示される
- [ ] 通常の計算は正常に動作

---

## Step 3: TRIM関数追加（5分）⭐⭐⭐☆☆

### 目標
空白を削除する関数

### 実装箇所
`lib/formulaEngine.ts`

### 変更内容

#### 3-1. TRIM関数の追加
```typescript
// lib/formulaEngine.ts
// SHOWDATA関数の後に追加（約625行目付近）

// TRIM関数: 余分な空白を削除
export function TRIM(text: string): string {
  return String(text).trim().replace(/\s+/g, ' ');
}
```

#### 3-2. 関数マップに登録
```typescript
// 関数パラメータリストに追加（約770行目付近）
const func = new Function(
  'SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN', 'ROUND',
  'IF', 'AND', 'OR',
  'CONCATENATE', 'LEFT', 'RIGHT', 'LEN',
  'TODAY', 'COUNTIF', 'SUMIF', 'VLOOKUP', 'IFERROR',
  'DATE', 'YEAR', 'MONTH', 'DAY', 'DATEDIF',
  'COUNTIFS', 'SUMIFS',
  'INDEX', 'MATCH',
  'SEARCH', 'ISNUMBER', 'FILTER', 'SHOWDATA',
  'TRIM',  // ← ここに追加
  `return ${formula};`
);

return func(
  SUM, AVERAGE, COUNT, MAX, MIN, ROUND,
  IF, AND, OR,
  CONCATENATE, LEFT, RIGHT, LEN,
  TODAY, COUNTIF, SUMIF, VLOOKUP, IFERROR,
  DATE, YEAR, MONTH, DAY, DATEDIF,
  COUNTIFS, SUMIFS,
  INDEX, MATCH,
  SEARCH, ISNUMBER, FILTER, SHOWDATA,
  TRIM  // ← ここに追加
);
```

### テスト方法
```excel
=TRIM("  hello  world  ")  → "hello world"
=TRIM("   佐藤   ")        → "佐藤"
```

### 完了確認
- [ ] 前後の空白が削除される
- [ ] 中間の連続空白が1つになる

---

## Step 4: UPPER/LOWER関数追加（10分）⭐⭐☆☆☆

### 目標
大文字・小文字変換関数

### 実装箇所
`lib/formulaEngine.ts`

### 変更内容

#### 4-1. UPPER/LOWER関数の追加
```typescript
// TRIM関数の後に追加

// UPPER関数: 大文字に変換
export function UPPER(text: string): string {
  return String(text).toUpperCase();
}

// LOWER関数: 小文字に変換
export function LOWER(text: string): string {
  return String(text).toLowerCase();
}
```

#### 4-2. 関数マップに登録
```typescript
// 関数パラメータリストに追加
const func = new Function(
  // ... (既存の関数)
  'SEARCH', 'ISNUMBER', 'FILTER', 'SHOWDATA',
  'TRIM', 'UPPER', 'LOWER',  // ← ここに追加
  `return ${formula};`
);

return func(
  // ... (既存の関数)
  SEARCH, ISNUMBER, FILTER, SHOWDATA,
  TRIM, UPPER, LOWER  // ← ここに追加
);
```

### テスト方法
```excel
=UPPER("hello")      → "HELLO"
=LOWER("WORLD")      → "world"
=UPPER("佐藤 太郎")  → "佐藤 太郎"（日本語は変わらない）
```

### 完了確認
- [ ] 英字が大文字・小文字に変換される
- [ ] 日本語はそのまま

---

## 🎉 Phase 1 完了！

ここまでで **1時間**。以下が完了しました：
- ✅ エラーコードが統一された
- ✅ ゼロ除算エラーが表示される
- ✅ TRIM, UPPER, LOWER関数が使える

**ビルド＆テスト**:
```bash
npm run build
npm run dev
```

ブラウザで確認：
```excel
=1/0                              → #DIV/0!
=FILTER(A:E, "存在しない", B:B)   → #N/A
=TRIM("  hello  ")                → "hello"
=UPPER("test")                    → "TEST"
```

---

## Step 5: IFS関数追加（30分）⭐⭐⭐⭐☆

### 目標
複数条件のIF文を簡潔に書ける

### 実装箇所
`lib/formulaEngine.ts`

### 変更内容

#### 5-1. IFS関数の追加
```typescript
// IF関数の後に追加（約118行目付近）

// IFS関数: 複数条件を順に評価
export function IFS(...conditions: any[]): any {
  // 条件と値のペア（条件, 値, 条件, 値, ...）
  if (conditions.length % 2 !== 0) {
    throw new Error('#VALUE!');
  }

  for (let i = 0; i < conditions.length; i += 2) {
    const condition = conditions[i];
    const value = conditions[i + 1];

    // 条件が真の場合、値を返す
    if (condition === true || condition === 1 || condition === 'TRUE') {
      return value;
    }
  }

  // すべての条件が偽の場合
  throw new Error('#N/A');
}
```

#### 5-2. 関数マップに登録
```typescript
const func = new Function(
  'SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN', 'ROUND',
  'IF', 'IFS', 'AND', 'OR',  // ← IFSを追加
  // ...
);

return func(
  SUM, AVERAGE, COUNT, MAX, MIN, ROUND,
  IF, IFS, AND, OR,  // ← IFSを追加
  // ...
);
```

### テスト方法
```excel
# G列などで試す
=IFS(E2>=2020, "新人", E2>=2010, "中堅", E2>=2000, "ベテラン", TRUE, "大ベテラン")

# 結果（E2=2015の場合）: "中堅"
```

### 使用例
```excel
# スコアに応じた評価
=IFS(A1>=90, "優", A1>=80, "良", A1>=60, "可", TRUE, "不可")

# 部署の英語名
=IFS(C2="営業部", "Sales", C2="IT部", "Tech", C2="経理部", "Finance", TRUE, "Other")
```

### 完了確認
- [ ] 最初に真になった条件の値が返る
- [ ] すべて偽の場合は `#N/A`

---

## Step 6: XLOOKUP関数追加（1時間）⭐⭐⭐⭐⭐

### 目標
VLOOKUPの改良版（より柔軟な検索）

### 実装箇所
`lib/formulaEngine.ts`

### 変更内容

#### 6-1. XLOOKUP関数の追加
```typescript
// VLOOKUP関数の後に追加（約310行目付近）

// XLOOKUP関数: VLOOKUPの改良版
export function XLOOKUP(
  lookupValue: any,
  lookupArray: any[],
  returnArray: any[],
  ifNotFound: any = '#N/A',
  matchMode: number = 0,
  searchMode: number = 1
): any {
  // 配列の長さチェック
  if (!Array.isArray(lookupArray) || !Array.isArray(returnArray)) {
    throw new Error('#VALUE!');
  }

  if (lookupArray.length !== returnArray.length) {
    throw new Error('#VALUE!');
  }

  // matchMode:
  // 0 = 完全一致（デフォルト）
  // -1 = 以下の最大値
  // 1 = 以上の最小値
  // 2 = ワイルドカード一致

  if (matchMode === 0) {
    // 完全一致
    for (let i = 0; i < lookupArray.length; i++) {
      if (lookupArray[i] === lookupValue) {
        return returnArray[i];
      }
    }
  } else if (matchMode === -1) {
    // 以下の最大値（昇順ソート済みと仮定）
    let lastMatch = -1;
    for (let i = 0; i < lookupArray.length; i++) {
      if (toNumber(lookupArray[i]) <= toNumber(lookupValue)) {
        lastMatch = i;
      } else {
        break;
      }
    }
    if (lastMatch >= 0) {
      return returnArray[lastMatch];
    }
  } else if (matchMode === 1) {
    // 以上の最小値（降順ソート済みと仮定）
    for (let i = 0; i < lookupArray.length; i++) {
      if (toNumber(lookupArray[i]) >= toNumber(lookupValue)) {
        return returnArray[i];
      }
    }
  } else if (matchMode === 2) {
    // ワイルドカード一致
    const pattern = String(lookupValue)
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${pattern}$`, 'i');

    for (let i = 0; i < lookupArray.length; i++) {
      if (regex.test(String(lookupArray[i]))) {
        return returnArray[i];
      }
    }
  }

  // 見つからない場合
  return ifNotFound;
}
```

#### 6-2. 関数マップに登録
```typescript
const func = new Function(
  // ...
  'VLOOKUP', 'XLOOKUP', 'IFERROR',  // ← XLOOKUPを追加
  // ...
);

return func(
  // ...
  VLOOKUP, XLOOKUP, IFERROR,  // ← XLOOKUPを追加
  // ...
);
```

### テスト方法
```excel
# 基本的な検索
=XLOOKUP("037", A:A, B:B)  → "佐藤 誠"

# 見つからない場合のデフォルト値
=XLOOKUP("999", A:A, B:B, "該当なし")  → "該当なし"

# VLOOKUPより柔軟（戻り配列を自由に指定）
=XLOOKUP("037", A:A, C:C)  → 部署を取得
=XLOOKUP("037", A:A, D:D)  → 役職を取得
```

### 完了確認
- [ ] IDから氏名を検索できる
- [ ] 見つからない場合のデフォルト値が機能
- [ ] VLOOKUPより柔軟に使える

---

## Step 7: UNIQUE関数追加（1時間）⭐⭐⭐⭐☆

### 目標
重複を除いたリストを作成

### 実装箇所
`lib/formulaEngine.ts`

### 変更内容

#### 7-1. UNIQUE関数の追加
```typescript
// FILTER関数の後に追加（約680行目付近）

// UNIQUE関数: 重複を除去
export function UNIQUE(array: any[], byCol: boolean = false): any {
  if (!Array.isArray(array)) {
    throw new Error('#VALUE!');
  }

  // 1次元配列に変換
  let flatArray: any[];
  if (Array.isArray(array[0])) {
    // 2次元配列の場合、最初の列のみ取得
    flatArray = array.map(row => row[0]);
  } else {
    flatArray = array;
  }

  // 重複除去
  const seen = new Set();
  const unique: any[] = [];

  for (const item of flatArray) {
    const key = String(item);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  // 結果が空の場合
  if (unique.length === 0) {
    throw new Error('#CALC!');
  }

  // 文字列化して返す（スピル未実装のため）
  return `[${unique.length}個の固有値]\n` + unique.join('\n');
}
```

#### 7-2. 関数マップに登録
```typescript
const func = new Function(
  // ...
  'SEARCH', 'ISNUMBER', 'FILTER', 'UNIQUE', 'SHOWDATA',  // ← UNIQUEを追加
  // ...
);

return func(
  // ...
  SEARCH, ISNUMBER, FILTER, UNIQUE, SHOWDATA,  // ← UNIQUEを追加
  // ...
);
```

### テスト方法
```excel
# 部署のユニークリスト
=UNIQUE(C:C)

# 結果:
[8個の固有値]
部署
営業部
IT部
経理部
人事部
総務部
企画部
開発部
製造部
```

### 完了確認
- [ ] 重複が除去される
- [ ] 固有値の数が表示される
- [ ] すべての固有値がリスト表示される

---

## Step 8: エラー表示の色分け（30分）⭐⭐⭐☆☆

### 目標
エラーを赤色で目立たせる

### 実装箇所
`components/ExcelLikeInterface.tsx`

### 変更内容

#### 8-1. セルレンダラーの修正
```typescript
// components/ExcelLikeInterface.tsx
// Handsontableの設定に追加（約150行目付近）

cells: (row: number, col: number) => {
  const value = sheets[activeSheetIndex].data[row]?.[col];

  // エラーセルのスタイリング
  if (typeof value === 'string' && value.startsWith('#')) {
    return {
      className: 'error-cell',
      renderer: 'text',
    };
  }

  return {};
}
```

#### 8-2. CSSスタイルの追加
```typescript
// app/globals.css または components/ExcelLikeInterface.tsx内に追加

<style jsx global>{`
  .error-cell {
    background-color: #FEE2E2 !important;
    color: #DC2626 !important;
    font-weight: bold !important;
  }

  /* エラーセルのホバー効果 */
  .error-cell:hover {
    background-color: #FECACA !important;
  }
`}</style>
```

または、Handsontableの設定内で直接スタイルを適用：

```typescript
cells: (row: number, col: number) => {
  const value = sheets[activeSheetIndex].data[row]?.[col];

  if (typeof value === 'string' && value.startsWith('#')) {
    return {
      className: 'htCenter htMiddle',
      renderer: (
        instance: any,
        td: HTMLTableCellElement,
        row: number,
        col: number,
        prop: any,
        value: any,
        cellProperties: any
      ) => {
        td.innerHTML = value;
        td.style.backgroundColor = '#FEE2E2';
        td.style.color = '#DC2626';
        td.style.fontWeight = 'bold';
        td.style.textAlign = 'center';
        return td;
      },
    };
  }

  return {};
}
```

### テスト方法
```excel
=1/0                              → 赤背景・赤文字で #DIV/0!
=FILTER(A:E, "存在しない", B:B)   → 赤背景・赤文字で #N/A
=VLOOKUP("999", A:B, 2, FALSE)    → 赤背景・赤文字で #N/A
```

### 完了確認
- [ ] エラーが赤色で表示される
- [ ] 背景色も変わる
- [ ] 太字で目立つ

---

## 🎉 Phase 2 完了！

ここまでで **Phase 1 + Phase 2** 完了（合計4時間）。

**実装した関数**:
- ✅ IFS（複数条件）
- ✅ XLOOKUP（柔軟な検索）
- ✅ UNIQUE（重複除去）
- ✅ エラーの色分け

**ビルド＆テスト**:
```bash
npm run build
npm run dev
```

**動作確認**:
```excel
=IFS(E2>=2020, "新人", E2>=2010, "中堅", TRUE, "ベテラン")
=XLOOKUP("037", A:A, B:B, "見つかりません")
=UNIQUE(C:C)
```

---

## 📊 進捗状況

```
[■■■■■■■■□□] 80% - Phase 2完了

完了:
✅ Step 1: エラーコード統一
✅ Step 2: ゼロ除算エラー
✅ Step 3: TRIM関数
✅ Step 4: UPPER/LOWER関数
✅ Step 5: IFS関数
✅ Step 6: XLOOKUP関数
✅ Step 7: UNIQUE関数
✅ Step 8: エラー色分け

残り:
⬜ Step 9: スピル機能（2-3日）
⬜ Step 10: 配列対応（1日）
```

---

## 次のステップ

Phase 3（スピル機能と配列対応）に進みますか？

それとも、ここまでの実装を **十分にテスト** してから進みますか？

**推奨**: まずPhase 2までをしっかりテストして、ユーザーフィードバックを得てから Phase 3 に進むのが安全です。

---

## 💾 変更の保存

すべてのステップ完了後：

```bash
# ビルド
npm run build

# Git コミット（実装した機能ごと）
git add lib/formulaEngine.ts
git commit -m "feat: エラーコード統一とTRIM/UPPER/LOWER関数追加"

git add lib/formulaEngine.ts
git commit -m "feat: IFS, XLOOKUP, UNIQUE関数追加"

git add components/ExcelLikeInterface.tsx
git commit -m "feat: エラーセルの色分け表示"
```

---

## 🎓 まとめ

**Phase 1 + 2 で得られる効果**:
- Excel互換性: 55% → **70%** (+15%)
- 新規関数: 31個 → **37個** (+6個)
- ユーザー体験: 大幅向上

**所要時間**: 4時間
**ROI**: ⭐⭐⭐⭐⭐

次は Phase 3（スピル機能）に進みましょう！
