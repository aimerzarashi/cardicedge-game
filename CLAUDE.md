# コマンド

- `make up` / `make down` / `make test`、任意で `make tunnel`（Cloudflare Quick Tunnel）
- pnpm・node はコンテナ内で実行する（例: `docker compose exec game pnpm lint`）。node_modules はコンテナの pnpm が作り、ホストと共有する
- lint / format は biome（`pnpm lint` / `pnpm format`）

# ディレクトリ構成

| パス | 責務 |
|---|---|
| app | App Router のページ・レイアウト |
| tests | Playwright のテスト |
| local/game | 開発用 Dockerfile |
| local/envoy | envoy の設定（開発環境の入口） |

# 入口（envoy）

- アクセスはすべて game-envoy:10000 を経由する（ホストは GAME_PORT、既定 3000）。game:3000 はホストに公開しない
- envoy を経由するホスト名からのアクセスは Next.js の `allowedDevOrigins` に追加する（`game-envoy`、`*.trycloudflare.com`）

# テスト

- Playwright のブラウザは game-playwright コンテナ（公式イメージ）で動く。game コンテナから `run-server` に接続して実行する
- baseURL は `http://game-envoy:10000`（本番と同じく envoy 経由で確認する）
- `@playwright/test` と compose の Playwright イメージ・`run-server` のバージョンは一致させる
