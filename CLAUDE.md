# コマンド

- `make up` / `make down` / `make clean` / `make core-local` / `make migrate` / `make migrate-generate NAME=<name>` / `make migrate-hash` / `make gen-api` / `make fmt` / `make lint` / `make test`、任意で `make tunnel`（Cloudflare Quick Tunnel。URL の再表示は `make url`）
- `make up` は先に `../core` の `make up` を実行する。`make down` は game だけを止める（core は止めない）。game-db のデータは名前付きのボリュームに置き、`make down` では消さない。消す `make clean` のあとは core も作り直す（seed が作り直したプレイヤーを、core が新しいプレイヤーとして扱い、前のデータが見えなくなるため。game#21・studio#19）
- pnpm・node はコンテナ内で実行する（例: `docker compose exec game pnpm lint`）。node_modules はコンテナの pnpm が作り、ホストと共有する
- lint は `make lint`（biome check、`pnpm typecheck`、scripts/check-migrations.sh、scripts/check-auth-schema.sh）でファイルを書き換えない。typecheck は `next typegen` で Next.js の型（LayoutProps 等）を生成してから tsc を実行する。フォーマットの修正は `make fmt`（biome format --write）
- pnpm のバージョンを上げるときは package.json の `packageManager`、local/game/Dockerfile・.build/Dockerfile・.gitlab-ci.yml の `PNPM_VERSION` を揃える（corepack は使わない）
- React Compiler を有効にしている（next.config.ts の `reactCompiler`）。useMemo / useCallback による手動メモ化は原則書かない

# ディレクトリ構成

| パス | 責務 |
|---|---|
| app | App Router のページ・レイアウト（`/` はログイン後の画面（ログイン中の表示・スターターの受け取りの状態・ログアウト、`/avatars` へのリンク）、`/avatars`（自分のアバターの一覧と作るフォーム。作ったら一覧に出るまで待って出し直す。待ち方は app/avatars/wait-avatar.ts）、`/boards`（公開中のボードの一覧。1 ボードを 2 行にし、名前・大きさ・マスの数（core の tileCounts をそのまま出す。拠点・チェックポイント・土地（属性ごと）の後ろに、転送円・橋・聖堂・ほこら・占い館・カード屋を 0 も含めて並べる）と、既定のルールを出す）・`/boards/[id]`（ボードの表示。既定のルール（目標の魔力等。項目の呼び方は app/messages.ts の RULE_LABELS）を出す。斜め見下ろしの格子（土地は属性ごとの色（地属性は緑、風属性は黄土色）、拠点は紫、チェックポイントは明るめの桃色、転送円は青緑・橋は茶色で対の番号「1-1」「1-2」を書き、聖堂・ほこら・占い館・カード屋は濃い灰青で 1 文字（聖・祠・占・店）を書く。凡例は 14 個で studio の道具と同じ並び。背景は画面のモードによらず濃い紺に固定し、マスとマスの間とマスの無い所は描かない（将来は背景画を敷く。マスの無い所は game#13））を、ドラッグ・ホイール・ボタンで動かして見る。格子の部品 board-grid.tsx・board-layout.ts は studio の app/boards から写したもので、片方を変えたらもう片方もそろえる）、`/login`・`/signup`・`/forgot-password`・`/reset-password`、`/api/auth/[...all]` は better-auth） |
| lib/auth.ts | better-auth の設定（サーバー側）。公式どおり `export const auth = betterAuth(...)`。CLI もこれを読む |
| lib/auth-client.ts | better-auth のクライアント |
| lib/core.ts | core の GraphQL を呼ぶ道具（`callCore`。JWT は `auth.api.getToken`。core に届かないときは `{ ok: false, reason: "unavailable" }` を返し、401 はログイン画面へ。studio の lib/core.ts と同じ形） |
| lib/player.ts | ログイン中のプレイヤー（アバターの一覧を含む）を確かめる `currentPlayer`（`me` を呼び、未登録なら `registerPlayer` を呼んで読み直す。React の `cache` で 1 リクエストの中は使い回す）。プレイヤーの情報を出すページだけで呼び、ログイン等の core を使わないページでは呼ばない |
| graphql | `make gen-api` が作る生成物（core から取り出したスキーマ `schema.graphql` と graphql-codegen の型）。手で直さない。コミットする（CI に core が無くても型の検査が通るように） |
| codegen.ts・.graphqlrc.yaml | graphql-codegen の設定と、VSCode の GraphQL の拡張の設定（studio と同じ） |
| lib/search-params.ts | ページの `searchParams` の値を 1 つにする `first`（studio の lib/search-params.ts から使うものだけ写した） |
| lib/mail.ts | SMTP でのメール送信（`sendMail`） |
| lib/use-hydrated.ts | フォームをハイドレーションの後まで送信させないための印（better-auth のクライアントを呼ぶ認証の画面で使う） |
| proxy.ts | 未ログインのときにログイン画面へ移す（Next.js 16 の proxy。Cookie の有無だけを見る） |
| migrations | DB マイグレーション（`NNNN_name.sql` + `atlas.sum`）。better-auth のテーブルも `auth generate` で SQL にしてここに置き、Atlas で適用する |
| local/migrate | マイグレーション用イメージ（Atlas Community + migrations。core と同じ構成） |
| scripts/check-migrations.sh | Atlas が検出しない migrations の違反の検査（core と同じものを置く。変えるときは core / studio と揃える） |
| scripts/check-auth-schema.sh | better-auth の設定と DB（DATABASE_URL）のスキーマに差分が無いことの検査（マイグレーションの作り忘れを防ぐ） |
| scripts/seed.ts | 開発・テスト用の、メールアドレスを確認済みのプレイヤーを作る（`pnpm db:seed`） |
| tests | Playwright のテスト |
| local/game | 開発用 Dockerfile |
| .build | 本番用 Dockerfile（standalone 出力を node で動かす。テスト用環境・CI でも使う） |
| local/core-db | テスト用の環境（compose.test.yaml）の core-db の初期化（core_game を作る。core のものを使わないのは、../core のブランチしだいで中身が変わるため） |
| local/core-master | テスト用の環境（compose.test.yaml）の core_game に入れるマスタの SQL（`master.sql`） |
| local/envoy | envoy の設定（開発環境・テスト用の環境の入口。relay-listener.yaml はテスト用の環境だけの中継役用の入口） |

# 入口（envoy）

- アクセスはすべて game-envoy:10000 を経由する（ホストは GAME_PORT、既定 3000）。game:3000 はホストに公開しない
- envoy を経由するホスト名からのアクセスは Next.js の `allowedDevOrigins` に追加する（`game-envoy`、`*.trycloudflare.com`）

# 画面の決まり

studio の決まりに合わせる（game は studio と同じ構成にする。UI は参照の game ではなく studio を下敷きにする）。見た目の作り方（デザインシステム）は別に決める。

- Next.js の仕様は、覚えている知識ではなく、入っている版に同梱された公式の文書（`node_modules/next/dist/docs`）を探して読んで確かめる（版ごとの変化が大きいため）
- 画面は表示と入力の受け渡しに徹し、ドメインの判断（正誤・権限・計算）は core に任せる
- core が返した一覧を画面で絞り込んだり並べ替えたりしない。要るなら core の引数で渡す
- 入力の検査は送信前の最小限（`required` 等）にし、正誤は core に任せる。上限などの値を game に書き写さない（core を変えたときにずれるため）
- 画面が持つ状態は、表示のためのもの（開閉・入力中の値・読み込み中等）だけにする
- 文言は game が作る。core は文言を返さず、結果の型と値（`__typename`・`field`・`max` 等）だけを返す（core の決まり）ため、型と値から文言を組み立てる
- 標準（JS・HTML・CSS）で用意されている機能があれば、それだけのためにパッケージを足さない（日付・数値の表示は `Intl`、ダイアログは `<dialog>`、ポップオーバーは `popover` 属性 等）。パッケージを足すときは、標準で足りない理由を MR に書く
- 実行時の検査は、型で保証できない境界（フォームの入力の `FormData` 等）だけで行う。中身の正誤は core が判定するため、game が確かめるのは形（文字列であること等）だけ。構造のある検査が要る境界が出てきたら valibot を入れる（Zod は使わない）
- 絞り込み・ページ（カーソル）等は URL に持ち、`useState` で持たない。ページ（Server Component）は `searchParams` で読み、変えるときは `next/form` の `<Form>`（GET）か `<Link>` を使う

## React（Async React）

非同期の処理は、React Conf 2025 の「Async React」の考え方に沿って、待ち状態・楽観的な表示・読み込みの境界を React に任せ、部品ごとに読み込み中の印・エラー・競合を手で持たない。

- 読み込み: データは async の Server Component で読み、読み込み中の表示は `Suspense`（`loading.tsx` か `<Suspense>`）の境界で出す。`useEffect` と `useState` でデータを取りに行かない
- 変更: core を呼ぶフォームは Server Action（`<form action>`）と `useActionState` で送る。送信中の表示は `useActionState` の待ち状態か `useFormStatus` で出す。ハイドレーションの前でも POST で届くため、送れなくする工夫（`useHydrated`）は要らない
- 更新の間: 絞り込み・ページの移動は Transition の中で行い、前の表示を残したまま次を待つ。素早い入力（名前の検索等）には `useDeferredValue` を使う
- 先に見せる: 変更の結果を先に見せるときは `useOptimistic` を使う
- 誤り: 想定内の誤り（入力の誤り・名前の重複・権限なし）は core の結果の型として表示し、想定外の誤りはエラーの境界（`error.tsx`）で受ける
- React Compiler に任せ、手動のメモ化（`useMemo`・`useCallback`・`React.memo`）を書かない。`forwardRef` を使わない（`ref` は普通の prop）。非推奨の警告が出たら、今の推奨の書き方に直す
- better-auth のクライアントを呼ぶ認証の画面（ログイン等）は、ブラウザで Cookie を受け取る形のため、今の形（`authClient` と `useState`）のままにする。その送信は、ハイドレーション前に送るとブラウザ標準の GET で入力値が URL に載るため、`useHydrated` でハイドレーションまで押せなくする

# 統合（core）

- core と共有する game 用のネットワーク `diecardomain-game` に参加するのは game-envoy だけ（studio 用の `diecardomain-studio` とは分け、studio から game に内部から届く経路を無くす。studio#30・core#45）。game は参加させない（core・studio から直接届くと x-client-ip を偽装できる。studio#11）。game から core へは game-envoy の `/game/graphql`、core から game へは game-envoy を通す
- envoy は `/game/graphql` を core に転送する（core が止まっていれば 503）
- core が game の JWT を検証するための JWKS は、game-envoy 経由の `/api/auth/jwks`。core 側の設定（`GAME_JWKS_URL`・`GAME_JWT_ISSUER`・`GAME_JWT_AUDIENCE`）と game の `JWT_ISSUER`・`JWT_AUDIENCE` を一致させる
- game が前提にする core の版は、Makefile の `CORE_VERSION` に書く（game の .env は git 管理しないため）。`make gen-api` はその版のイメージから `schema game` で game 用のスキーマを取り出して型を作る（上げるときはやり直し、graphql/ の差分と一緒にコミットする）。登録（core#37）より前の版では、`me`・`registerPlayer` が無く、tests/player.spec.ts・tests/core-jwt.spec.ts が通らない
- マイルストーンの途中で、まだリリースしていない core の変更を使うときは、`make core-local` で手元の ../core から `diecardomain/core:local`・`core-migrate:local` をリリースと同じ Dockerfile で作り、`make gen-api CORE_VERSION=local`・`make test CORE_VERSION=local` のように引数で渡す。Makefile の `CORE_VERSION` は local にしない（コミットした Makefile が手元にしか無いイメージを指さないようにするため）。マイルストーンの MR の前に、core のリリースした版に `CORE_VERSION` を固定して `make test` をやり直す
- 開発の環境（`make up`）の core は、ルートの決まり（core は 1 つを共有する）のため ../core のソースから動く。`CORE_VERSION` とずれることはありうる
- core の宛先は環境変数 `CORE_GRAPHQL_URL`（game-envoy の `/game/graphql`）

# テスト

- `make test` は compose.test.yaml（プロジェクト名 game-test）で専用の core・DB・本番用イメージの game を起動し、終了後に破棄する。開発用環境・開発用 DB には触れない。core は ../core のソースではなく、`CORE_VERSION` のイメージ（`diecardomain/core`・`core-migrate`）を使う
- テストは開発用イメージの game-test-runner（profile: runner）から `docker compose run` で実行する。本番用イメージにはテストコードを含めない
- Playwright のブラウザは game-playwright コンテナ（公式イメージ）で動く。game コンテナから `run-server` に接続して実行する
- baseURL は `http://game-envoy:10001`（テスト用の環境だけにある中継役用の入口。公開の入口は `PLAYWRIGHT_PUBLIC_URL`）
- `run-server` は game の node_modules の `@playwright/test` を Playwright のコンテナに読み取り専用で渡して起動する（npx で起動のたびに npm から取ってこない。npm に届かないとサーバーが立たないため。studio#25）。`@playwright/test`（package.json）と compose の Playwright イメージのバージョンは一致させる
- テストは tests/fixtures.ts の `test` / `expect` を使う。テストごとに `X-Forwarded-For` で別の IP を名乗り、本番モードのレート制限（ログインは同じ IP から 10 秒に 3 回）でほかのテストと枠を共有しないようにしている。名乗った IP が効くのは、テスト用の環境だけにある中継役用の入口（envoy の 10001。`PLAYWRIGHT_BASE_URL`）を通るとき。公開の入口は `PLAYWRIGHT_PUBLIC_URL`
- `make test` のテスト用のプレイヤーは seed（player@example.com。パスワード付き・確認済み）。ほかのアカウントはテストの中でサインアップし、Mailpit の確認のメールで確認する（tests/account.ts）
- メールは Mailpit が受け止め、テストは Mailpit の API で読む（tests/mail.ts）。メールのリンクのホスト名は BETTER_AUTH_URL のため、パスだけを使う（開発用の環境では localhost:3000 で、ブラウザのコンテナから届かない）
- core_game のマスタ（公開中のカード・スターターデッキ 2 つ・game_rules・ボード（公開中 3 つと使用不可 1 つ。公開中 C に転送円の対 2 つ・橋の対 1 つ・施設 4 つを置く））は、core-publish-master（compose.test.yaml の使い捨ての psql）が `local/core-master/master.sql` を流して入れる。core の `make publish-master`（studio の read model から写す）と同じ形の行で、形を変えるときは ../core の migrations と tests/testhelper/master.go に合わせる（ボードの metadata は studio の read model の BoardMetadata の形で、kind・attribute は小文字（kind は prophecy_shop 等 snake_case）。default_rules・tile_counts は snake_case で tile_counts は 15 項目すべてを書く。pairs（無ければ `[]`）も必ず書く。core は無い行を読み出しの誤りにするため。土地のマスだけが attribute を持つ）。core はこれが済んでから起動するため、登録すればスターターが配られる
- tests/core-jwt.spec.ts は、サインアップしたばかりのプレイヤーの JWT で core の `me` を呼び、`PlayerNotRegisteredError` が返ることで、core が game の JWT を受け付けることを確かめる。画面でログインするとトップが登録してしまうため、API でログインする。seed のプレイヤーは tests/player.spec.ts が登録するので使わない
- tests/player.spec.ts は、トップを開くと core に登録されてスターターを受け取ること（受け取り中は再読み込みして待つ）、もう一度開いても登録が重ならないことを確かめる。core に届かないときの表示は自動のテストにしない（studio と同じ）
- tests/avatar.spec.ts は、アバターの画面（/avatars）で、作ると一覧に作った順で出ること、名前の誤り（空・長すぎる）、同じ名前は作れず入力した値が残ること、6 体目は作れないことを確かめる。作る数が絡むため、テストごとに新しくサインアップしたプレイヤーを使い、共有の seed のプレイヤーは使わない。core に届かないときの表示は自動のテストにしない
- tests/boards.spec.ts は、ボードの一覧（/boards）に公開中のボードが名前の順に出て使用不可は出ないこと、ボードの表示（/boards/[id]）でマスの種類（土地は属性つき）とマスの無い所を描かないこと、凡例の 14 個の並び、転送円・橋の対の番号と色、施設の 1 文字と色、地属性・風属性の色（凡例の見本）、既定のルールが出ること、一覧にマスの数（特殊なマスを含む）と既定のルールが出ること、拡大・縮小・全体を表示で倍率（data-scale）が変わること、使用不可・無い・形の違う ID のボードが「見つからない」になることを確かめる。seed のプレイヤーで読むだけ（登録は同じプレイヤーで何度行っても重ならない）

# 認証（better-auth）

- better-auth は標準の範囲で使う（独自の項目・独自の認証処理は作らない）。メールアドレス + パスワード。サインアップはメールアドレスの確認つき（`requireEmailVerification`）
- JWT の issuer / audience は環境変数 `JWT_ISSUER` / `JWT_AUDIENCE`（必須）で渡し、core の設定（`GAME_JWT_ISSUER` / `GAME_JWT_AUDIENCE`）と一致させる（`diecardomain-game` / `diecardomain-core`）。core は (iss, sub) でプレイヤーを識別するため、運用を始めた環境では issuer を変えない
- 誰がプレイヤーか・権限は core が決める。better-auth に任せるのは、確認つきのサインアップ・ログイン・パスワードの再設定だけ。Admin プラグイン・role は使わない
- JWT には `definePayload` で `email`・`email_verified` だけを足す（studio と同じ中身。core はプレイヤーを (iss, sub) で識別し、今はメールアドレスを使わない）。メールアドレスの変更（changeEmail）は、使う場面が出るまで有効にしない（better-auth の既定のまま）
- better-auth の `name` は空文字にし、表示・メールに使わない
- lib/auth.ts とそこから読むファイル（lib/mail.ts）は、seed・better-auth の CLI が Node.js で直接読むため、パスの別名（`@/`）を使わず相対パス（`./mail.ts`）で import する（別名だと CLI が「server-only を外せ」という紛らわしいエラーを出す）
- メールは lib/mail.ts の `sendMail` だけで送る。better-auth の送信の関数では送信を await しない（登録の有無で応答時間が変わるため。公式の注意）
- 利用者の IP は envoy が上書きで入れる `x-client-ip` だけを見る（`advanced.ipAddress.ipAddressHeaders`）。game の 3000 番を公開しない（直接届くと偽装できる）。中継役用の入口（local/envoy/relay-listener.yaml）は compose.test.yaml でだけ重ね、開発用・リリース版の環境に置かない
- レート制限の回数は DB（`rateLimit.storage: "database"`）で数える。テストのためにレート制限を無効にする設定は作らない
- secret（BETTER_AUTH_SECRET）はそのまま変えると jwks を復号できず 500 になる。変えるときは README の手順に従う
- lib/auth.ts は公式チュートリアルどおり、読み込み時に betterAuth を作る。next build 中は環境変数を渡さないため、better-auth が「Base URL is not set」（警告）と「default secret」（エラーのログ）を出すが、ビルドは成功し、実行時はコンテナの環境変数が使われる
- JWT_ISSUER / JWT_AUDIENCE が未設定だと better-auth は黙って BETTER_AUTH_URL を使うため、lib/auth.ts で実行時に必須チェックしている（next build 中は `NEXT_PHASE=phase-production-build` で判定して確かめない）
- lib/auth.ts は `import "server-only"` でクライアントからの読み込みをビルドエラーにしている。Node.js で直接動かす seed・CLI は `--conditions=react-server` を付けて実行する（付けないと server-only がエラーを投げる）
- DB は game_auth（ユーザーは game_user）。core の DB（core_game）とは別で、どのサーバーにあるかはつなぎ先（`DATABASE_URL`）の設定だけで決める（ルートの CLAUDE.md の「DB の配置」）
- DB のスキーマは better-auth の CLI（`auth migrate`）で直接変えない。`make migrate-generate` で差分 SQL を migrations に出し、Atlas で適用する（core・studio と同じ手順・同じ記録にするため）
- マイグレーションは追加のみ。適用済みのファイルは変更・削除・改名しない。リリース前に限り並びを作り直してよく、そのときは migrations/BASELINE の 1 行目を書き換える（core と同じ。core#33）。Atlas のバージョンは local/migrate/Dockerfile の FROM を core / studio と揃える
- 環境変数はサーバー側（lib/auth.ts）でだけ読む。`NEXT_PUBLIC_` は使わない（ビルド時に埋め込まれ、コンテナの環境変数で変えられなくなるため）
