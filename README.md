# SkillLens PoC - 事務職スキルアセスメント

## 📋 プロジェクト概要

SkillLensは、スプレッドシート操作を通じて実務遂行能力を測定する採用アセスメントツールのPoCです。

### コアコンセプト
- **脱・ブラックボックス**: 履歴書や面接ではなく、実務シミュレーションでパフォーマンスを評価
- **氷山の下層を測る**: 知識・スキルだけでなく、思考プロセス・行動特性を可視化
- **False Positive排除**: 「履歴書は立派だが実務ができない人材」を100%足切り

### このPoCの目的
**Type A: 事務・バックオフィス（Process Tracking Logic）** の技術検証

スプレッドシート操作ログから「関数活用度」を自動判定できることを実証します。

---

## 🎯 測定内容

### 課題
「名簿から『佐藤』を含む行をすべて抽出してください」

### スコアリングルール
- **100点**: FILTER/QUERY等の高度な関数を使用
- **50点**: フィルター機能を使用
- **0点**: 手動入力のみ

### 記録される操作
- セル編集（`CELL_EDIT`）
- 関数入力（`FORMULA_INPUT`）
- フィルター適用（`FILTER_APPLY`）
- コピー&ペースト（`COPY_PASTE`）
- 提出（`SUBMIT`）

---

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Handsontable** - Excel風スプレッドシートUI

### バックエンド
- **Next.js API Routes**
- **Prisma** (ORM)
- **SQLite** (開発用DB)

### 状態管理
- React Hooks (useState, useEffect)
- クライアントサイドログ管理

---

## 📁 プロジェクト構造

```
recruit_poc/
├── app/
│   ├── page.tsx                    # ランディングページ
│   ├── test/
│   │   └── page.tsx                # テスト実施画面
│   ├── api/
│   │   ├── session/route.ts        # セッション作成API
│   │   ├── logs/route.ts           # ログ保存API
│   │   └── score/route.ts          # スコア計算API
│   ├── layout.tsx                  # ルートレイアウト
│   └── globals.css                 # グローバルスタイル
├── components/
│   ├── SpreadsheetEditor.tsx       # スプレッドシートエディタ
│   ├── TaskDescription.tsx         # 課題説明コンポーネント
│   └── ResultsPanel.tsx            # 結果表示パネル
├── lib/
│   ├── types.ts                    # 型定義
│   ├── scoreCalculator.ts          # スコア計算ロジック
│   ├── sampleData.ts               # サンプル名簿データ
│   └── prisma.ts                   # Prismaクライアント
├── prisma/
│   └── schema.prisma               # データベーススキーマ
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. データベースのセットアップ

```bash
npx prisma generate
npx prisma db push
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

---

## 🐳 Dockerセットアップ（推奨）

Dockerを使用することで、環境構築を簡略化し、本番環境に近い状態でアプリケーションを実行できます。

### 前提条件
- Docker Desktop がインストールされていること
- Docker Compose が利用可能であること

### 1. 環境変数の設定（オプション）

`.env.local` ファイルを作成して環境変数を設定します：

```bash
cp .env.example .env.local
```

### 2. Dockerイメージのビルドと起動

```bash
docker-compose up -d --build
```

### 3. アプリケーションにアクセス

ブラウザで以下のURLにアクセス：
```
http://localhost:3000
```

### 4. ログイン情報

- **ユーザーID**: `mugen2026`
- **パスワード**: `maedaoguramugen`

### Dockerコマンド

```bash
# アプリケーションの起動
docker-compose up -d

# アプリケーションの停止
docker-compose down

# アプリケーションの再起動
docker-compose restart

# ログの確認
docker-compose logs -f app

# コンテナの状態確認
docker-compose ps

# データベースのリセット
docker-compose down -v
docker-compose up -d --build
```

### プロダクション vs 開発モード

現在の設定はプロダクションモード（`npm run build` + `npm run start`）です。

**プロダクションモードの利点**:
- ⚡ **高速**: 5-10倍速い
- 📦 **最適化済み**: コード圧縮、Tree Shaking
- 🚀 **本番環境向け**: SSR、ISRが最適化

詳細は [DOCKER_SETUP.md](./DOCKER_SETUP.md) を参照してください。

---

## 📖 使い方

### 1. テスト開始
トップページの「テストを開始する」ボタンをクリック

### 2. 課題を解く
名簿データから「佐藤」を含む行を抽出

**推奨される3つの解法**:

#### 🏆 方法1: FILTER関数（100点）
1. **空いているセル（例: G1）をクリック**
2. 以下の数式を入力:
   ```
   =FILTER(A:E, ISNUMBER(SEARCH("佐藤", B:B)))
   ```
3. Enterキーを押す
4. 「提出する」ボタンをクリック

**答えの表示場所**: G列以降に抽出結果が表示されます

#### 👍 方法2: フィルター機能（50点）
1. **「氏名」列のヘッダーをクリック**
2. 右側の**▼ボタンをクリック**
3. 「条件でフィルタ」を選択
4. 「次を含む」→「佐藤」と入力
5. OKをクリック
6. 「提出する」ボタンをクリック

**答えの表示場所**: 元のテーブルが絞り込まれ、佐藤さんのみが表示されます

#### 😅 方法3: 手動作業（0点）
- 目視で探してコピー&ペースト（非推奨）

### 3. 提出
「提出する」ボタンをクリックして結果を確認

---

## 💡 よくある質問

### Q: フィルターボタンが見えない
A: ヘッダー（「氏名」など）にマウスを乗せると、右側に▼ボタンが表示されます。表示されない場合はページを再読み込みしてください。

### Q: 答えはどこに書けばいいの？
A:
- **フィルター機能**: 元のテーブル自体を絞り込みます（別に書く必要なし）
- **FILTER関数**: G列などの空いているセルに数式を入力します
- **手動コピー**: 任意の空いているセルにコピー&ペースト

### Q: 数式の書き方が分からない
A: G1セルをクリックして、`=FILTER(A:E, ISNUMBER(SEARCH("佐藤", B:B)))` をそのままコピー&ペーストしてください。

---

## 🔬 検証可能な項目

### ✅ 技術検証の成功条件
- [ ] スプレッドシート上での操作が全て記録される
- [ ] 関数使用・フィルター使用・手動入力が正しく判別できる
- [ ] 同じ課題を複数回実行し、スコアが安定している
- [ ] ログデータからユーザーの行動パターンが読み取れる

### 📊 取得できるデータ
- 操作種別と詳細（セル座標、入力値、数式内容）
- タイムスタンプ（ミリ秒単位）
- 総操作数
- 所要時間
- 使用された関数リスト

---

## 🗃️ データベーススキーマ

### TestSession
テストセッション情報

| フィールド | 型 | 説明 |
|----------|---|------|
| id | String | セッションID |
| createdAt | DateTime | 開始日時 |
| completedAt | DateTime? | 完了日時 |
| status | String | ステータス (in_progress/completed) |

### OperationLog
操作ログ

| フィールド | 型 | 説明 |
|----------|---|------|
| id | String | ログID |
| sessionId | String | セッションID (外部キー) |
| timestamp | DateTime | タイムスタンプ |
| eventType | String | イベント種別 |
| eventData | String | イベント詳細 (JSON) |

### TestResult
テスト結果

| フィールド | 型 | 説明 |
|----------|---|------|
| id | String | 結果ID |
| sessionId | String | セッションID (外部キー, unique) |
| score | Int | スコア (0-100) |
| method | String | 判定手法 |
| analysis | String | 詳細分析 (JSON) |

---

## 🧪 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番モード起動
npm run start

# Prisma Studio (DB GUI)
npm run db:studio

# データベース初期化
npx prisma db push
```

---

## 📈 次のステップ

### Phase 2: 機能拡張（検証後）
- [ ] キーストローク分析の実装
- [ ] コンプライアンス意識の測定
- [ ] 複数課題のサポート
- [ ] 管理画面の作成

### Phase 3: 顧客検証（クローズドβ）
- [ ] 5社へのトライアル提供
- [ ] フィードバック収集
- [ ] スコアリング精度の調整

### Phase 4: プロダクト化
- [ ] Type B（営業・CS）の実装
- [ ] PostgreSQL/MySQL移行
- [ ] 認証・権限管理
- [ ] ATS連携API

---

## 🤝 フィードバック

技術検証後、以下の観点でレビューを実施してください：

1. **操作ログの網羅性**: 必要な操作が全て記録されているか
2. **スコアリングの妥当性**: 判定ロジックが意図通りに動作しているか
3. **UX**: 受験者が迷わず操作できるか
4. **パフォーマンス**: 大量データでも動作が安定しているか

---

## 📄 ライセンス

このPoCはプライベートプロジェクトです。

---

## 🔗 関連ドキュメント

- **事業計画書**: `/prompt.txt`
- [Handsontable Documentation](https://handsontable.com/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**開発日**: 2026-01-28
**バージョン**: 0.1.0 (PoC)
