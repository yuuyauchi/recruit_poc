# Docker セットアップガイド

## 前提条件

- Docker Desktop がインストールされていること
- Docker Compose が利用可能であること

## クイックスタート

### 1. 環境変数の設定（オプション）

`.env.local` ファイルを作成して環境変数を設定します：

```bash
cp .env.example .env.local
```

### 2. Docker イメージのビルドと起動

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

## Docker コマンド

### アプリケーションの起動

```bash
docker-compose up -d
```

### アプリケーションの停止

```bash
docker-compose down
```

### アプリケーションの再起動

```bash
docker-compose restart
```

### ログの確認

```bash
docker-compose logs -f app
```

### コンテナの状態確認

```bash
docker-compose ps
```

### イメージの再ビルド

コードを変更した場合：

```bash
docker-compose up -d --build
```

### データベースのリセット

```bash
docker-compose down -v
docker-compose up -d --build
```

## プロダクション vs 開発モード

現在の設定はプロダクションモード（`npm run build` + `npm run start`）です。

### プロダクションモードの利点

- ⚡ **高速**: 5-10倍速い
- 📦 **最適化済み**: コード圧縮、Tree Shaking
- 🚀 **本番環境向け**: SSR、ISRが最適化

### 開発モードに切り替える場合

`Dockerfile`の最後の行を変更：

```dockerfile
# プロダクションモード（現在）
CMD ["node", "server.js"]

# 開発モード（ホットリロード有効）
CMD ["npm", "run", "dev"]
```

## トラブルシューティング

### ポート3000が既に使用されている

```bash
# 使用中のプロセスを確認
lsof -i :3000

# または別のポートを使用
# docker-compose.ymlで変更:
ports:
  - "3001:3000"
```

### データベースファイルの問題

```bash
# ボリュームを削除して再作成
docker-compose down -v
docker-compose up -d --build
```

### ビルドエラー

```bash
# キャッシュをクリアして再ビルド
docker-compose build --no-cache
docker-compose up -d
```

## パフォーマンス

### プロダクションモード
- 初回起動: 約10-15秒
- リクエスト処理: 50-100ms
- メモリ使用量: 約200-300MB

### 開発モード
- 初回起動: 約20-30秒
- リクエスト処理: 500-1000ms
- メモリ使用量: 約500-800MB

**推奨**: 本番環境やパフォーマンステストではプロダクションモードを使用
