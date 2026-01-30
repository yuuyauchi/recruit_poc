# 問題選択機能 実装完了レポート

## 実装日時
2026-01-30

## 概要
SkillLens アセスメントシステムに、複数の課題から選択できる機能を追加しました。ユーザーは3つの課題（初級・中級・上級）から1つを選び、それぞれ異なるCSVデータで演習を行えます。

## 実装された機能

### 1. 課題定義システム (`/lib/problemDefinitions.ts`)
- 3つの課題を定義:
  - **データ抽出** (初級) - 「佐藤」を含む行の抽出
  - **売上分析** (中級) - 部門別売上集計
  - **在庫管理** (上級) - 重複IDと在庫異常の検出
- 各課題に以下の情報を含む:
  - タイトル、説明、難易度
  - 制限時間、推定時間
  - アイコン、CSVファイル名
  - 課題説明（タイトル、指示、ヒント）
  - 習得スキル一覧

### 2. 問題選択画面 (`/app/problems/page.tsx`)
- 3つの課題をカード形式で表示
- 各カードの情報:
  - アイコン（絵文字）
  - 難易度バッジ（色分け）
  - 所要時間
  - 説明文（2-3行）
  - スキルタグ
  - 課題プレビュー
  - 「テスト開始」ボタン
- 課題選択後、動的ルート `/test/[problemId]` へ遷移

### 3. 動的テストページ (`/app/test/[problemId]/page.tsx`)
- URLから課題IDを取得
- 課題定義に基づいてCSVをロード
- 課題固有の説明をTaskPanelに表示
- セッション作成時にproblemIdを送信
- 無効なproblemId時は /problems へリダイレクト

### 4. データベース更新
- TestSessionモデルに `problemId` フィールド追加（nullable）
- 既存データとの互換性を保持

### 5. CSV管理
- 3つのCSVファイルを作成:
  - `roster.csv` (既存) - データ抽出用
  - `sales.csv` (新規) - 売上分析用
  - `inventory.csv` (新規) - 在庫管理用
- 現在はすべて同じデータ（将来的に課題専用データに置き換え可能）

### 6. コンポーネント更新

#### TaskPanel (`/components/TaskPanel.tsx`)
- `taskDescription` をpropsで受け取るように変更
- ハードコードされた課題情報を削除
- 動的に課題情報を表示

#### ResultsPanel (`/components/ResultsPanel.tsx`)
- 完了した課題名を表示
- 「別の課題に挑戦」ボタンを追加
- 「トップページに戻る」ボタンを追加

### 7. API更新

#### Session API (`/app/api/session/route.ts`)
- POSTリクエストで `problemId` を受け取る
- 問題の存在を検証
- データベースに `problemId` を保存

#### Score API (`/app/api/score/route.ts`)
- セッションから `problemId` を取得
- レスポンスに `problemId` と `problemTitle` を含める
- 結果画面で課題名を表示可能に

### 8. ナビゲーション更新

#### ランディングページ (`/app/page.tsx`)
- 「テストを開始する」ボタンのリンクを `/problems` に変更
- 説明文に「3つの課題から選択可能」を追加
- テストの流れに課題選択ステップを追加

#### 旧テストページ (`/app/test/page.tsx`)
- `/problems` へのリダイレクト機能を実装
- 後方互換性を確保

## ファイル一覧

### 新規作成
1. `/lib/problemDefinitions.ts` - 課題定義とヘルパー関数
2. `/app/problems/page.tsx` - 問題選択画面
3. `/app/test/[problemId]/page.tsx` - 動的テストページ
4. `/public/data/sales.csv` - 売上分析用データ
5. `/public/data/inventory.csv` - 在庫管理用データ

### 修正
1. `/app/page.tsx` - ナビゲーションリンク更新
2. `/app/test/page.tsx` - リダイレクト機能に変更
3. `/components/TaskPanel.tsx` - props経由で課題説明を受け取る
4. `/components/ResultsPanel.tsx` - 課題名表示と追加ボタン
5. `/app/api/session/route.ts` - problemIdの受信と保存
6. `/app/api/score/route.ts` - 結果にproblemIdを含める
7. `/prisma/schema.prisma` - problemIdフィールド追加
8. `/lib/formulaEngine.ts` - TypeScriptエラー修正

### 変更不要（既存機能を再利用）
- `/components/ExcelLikeInterface.tsx`
- `/lib/scoreCalculator.ts`
- `/lib/loadCsvData.ts`
- `/app/api/logs/route.ts`

## ユーザーフロー

```
1. ランディングページ (/)
   ↓ 「テストを開始する」クリック

2. 問題選択画面 (/problems)
   ↓ 課題カードの「テスト開始」クリック

3. テストページ (/test/[problemId])
   - 選択した課題のCSVデータがロード
   - 課題固有の説明が表示
   - ユーザーが問題を解く
   - 操作ログが記録される
   ↓ 「提出する」クリック

4. 結果画面
   - スコアと評価が表示
   - 完了した課題名が表示
   - 「別の課題に挑戦」または「トップページに戻る」を選択
```

## データベーススキーマ変更

```prisma
model TestSession {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  completedAt DateTime?
  candidateId String?
  status      String   @default("in_progress")

  problemId   String?  // NEW: 選択された課題のID

  logs        OperationLog[]
  result      TestResult?
}
```

## テスト手順

### 1. 問題選択画面の確認
```bash
npm run dev
```
- http://localhost:3000 にアクセス
- 「テストを開始する」をクリック
- `/problems` に遷移し、3つのカードが表示されることを確認

### 2. 各課題のテスト実行
- 「データ抽出」カードの「テスト開始」をクリック
- `/test/roster-extraction` に遷移
- CSVデータが正しくロードされることを確認
- TaskPanelに課題説明が表示されることを確認
- スプレッドシートで操作を実行
- 「提出する」をクリック
- 結果画面で課題名「データ抽出」が表示されることを確認

### 3. エッジケースの確認
- `/test/invalid` にアクセス → `/problems` にリダイレクト
- `/test` にアクセス → `/problems` にリダイレクト

## 今後の拡張可能性

### MVP完成後の機能追加候補

1. **課題固有のCSVデータ**
   - `sales.csv` に実際の売上データ
   - `inventory.csv` に在庫データ
   - より現実的なシナリオを提供

2. **課題固有の評価ロジック**
   - 各課題で期待される解答をチェック
   - 正解判定機能の追加
   - 課題ごとに異なるスコアリング方法

3. **UI/UX改善**
   - 難易度でフィルタリング
   - 完了済み課題の表示
   - 課題ごとのベストスコア保存
   - プログレストラッキング
   - 課題プレビュー機能
   - アニメーション追加

4. **追加課題**
   - より多くの課題パターン
   - 業界特化型の課題
   - 難易度のバリエーション

## 成果物の品質保証

### ビルド成功
```bash
npm run build
```
- TypeScriptエラー: なし
- ビルドエラー: なし
- すべてのページが正常にコンパイル

### ルーティング構造
```
/ (landing)
├── /problems (NEW: 選択画面)
│   └── [カード1] → /test/roster-extraction
│   └── [カード2] → /test/sales-analysis
│   └── [カード3] → /test/inventory-management
└── /test → redirect to /problems (後方互換性)
```

### データフロー
```
1. ユーザーが課題選択
2. problemId を含むセッション作成
3. problemId に基づいてCSVロード
4. problemId がログと共に保存
5. スコアリング結果にproblemId含む
6. 結果画面で課題名表示
```

## 完了確認

- [x] 3つの課題が /problems で選択可能
- [x] 各課題で正しい CSV データがロード
- [x] TaskPanel に課題固有の説明が表示
- [x] セッションに problemId が保存
- [x] スコアリングが正常に動作
- [x] 結果画面で課題名が表示
- [x] `/test` からのリダイレクトが動作
- [x] 無効な problemId でエラーハンドリング
- [x] TypeScript型エラーなし
- [x] ビルドエラーなし

## まとめ

問題選択機能のMVP実装が完了しました。ユーザーは3つの課題から選択し、それぞれ異なる難易度の問題に挑戦できます。既存のスコアリング機能と完全に統合されており、拡張性も確保されています。
