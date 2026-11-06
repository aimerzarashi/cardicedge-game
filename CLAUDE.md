# コマンド

- `make up` / `make down` / `make clean` / `make core-local` / `make migrate` / `make migrate-generate NAME=<name>` / `make migrate-hash` / `make gen-api` / `make fmt` / `make lint` / `make test-unit` / `make test`、任意で `make tunnel`（Cloudflare Quick Tunnel。URL の再表示は `make url`）
- `make up` は先に `../core` の `make up` を実行する。`make down` は game だけを止める（core は止めない）。game-db のデータは名前付きのボリュームに置き、`make down` では消さない。消す `make clean` のあとは core も作り直す（seed が作り直したプレイヤーを、core が新しいプレイヤーとして扱い、前のデータが見えなくなるため。game#21・studio#19）
- pnpm・node はコンテナ内で実行する（例: `docker compose exec game pnpm lint`）。node_modules はコンテナの pnpm が作り、ホストと共有する
- lint は `make lint`（biome check、`pnpm typecheck`、scripts/check-migrations.sh、scripts/check-auth-schema.sh）でファイルを書き換えない。typecheck は `next typegen` で Next.js の型（LayoutProps 等）を生成してから tsc を実行する。フォーマットの修正は `make fmt`（biome format --write）
- pnpm のバージョンを上げるときは package.json の `packageManager`、local/game/Dockerfile・.build/Dockerfile・.gitlab-ci.yml の `PNPM_VERSION` を揃える（corepack は使わない）
- React Compiler を有効にしている（next.config.ts の `reactCompiler`）。useMemo / useCallback による手動メモ化は原則書かない

# ディレクトリ構成

| パス | 責務 |
|---|---|
| app | App Router のページ・レイアウト（`/` はログイン後の画面（ログイン中の表示・スターターの受け取りの状態・ログアウト、`/avatars` へのリンク）、`/avatars`（自分のアバターの一覧と作るフォーム。作ったら一覧に出るまで待って出し直す。待ち方は app/avatars/wait-avatar.ts）、`/boards`（公開中のボードの一覧。1 ボードを 2 行にし、名前・大きさ・マスの数（core の tileCounts をそのまま出す。拠点・チェックポイント・土地（属性ごと）の後ろに、転送円・橋・聖堂・ほこら・占い館・カード屋を 0 も含めて並べる）と、既定のルールを出す）・`/boards/[id]`（ボードの表示。既定のルール（目標の魔力・開始時の魔力・周回のボーナス・チェックポイントのボーナス・ラウンドの上限・サイコロの目の最小と最大の 7 つ。項目の呼び方は app/messages.ts の RULE_LABELS）を出す。斜め見下ろしの格子（土地は属性ごとの色（地属性は緑、風属性は黄土色）、拠点は紫、チェックポイントは明るめの桃色、転送円は青緑・橋は茶色で対の番号「1-1」「1-2」を書き、聖堂・ほこら・占い館・カード屋は濃い灰青で 1 文字（聖・祠・占・店）を書く。凡例は 14 個で studio の道具と同じ並び。背景は画面のモードによらず濃い紺に固定し、マスとマスの間とマスの無い所は描かない（将来は背景画を敷く。マスの無い所は game#13））を、ドラッグ・ホイール・ボタンで動かして見る。格子の部品 board-grid.tsx と、そこから出した純粋な関数 board-layout.ts・board-view.ts（表示の計算）・board-paint.ts（色・文字・マスの名前）は studio の app/boards から写したもので、片方を変えたらもう片方もそろえる。`.tsx` は Node が読めず単体テストにできないため、純粋な関数は `.ts` に出す）、`/npc-avatars`（自分が解放した NPC のアバターの一覧。名前と、割り当てた公開中のデッキの名前を割り当てた順に出す。解放した順で、ページ分けはしない。トップやアバターが読む `currentPlayer` の `me` には含めず、このページだけで `me { npcAvatars }` を読む。無ければ「まだ解放した NPC がいません」。game#34）・`/npc-avatars/[id]`（NPC のアバターの表示。解放していない・使用不可の ID は「見つかりません」。割り当てた公開中のデッキごとに、合計の枚数と、カード（名前・種類・枚数。種類 → 名前の順は core が並べる）を出す。NPC のデッキは単体では見せず、アバターを通してだけ出す（core#87・core#63・game#16））、`/decks`（自分のデッキの一覧。名前（詳細へのリンク）・合計の枚数・種類ごとの枚数（core の typeCounts をそのまま出す）を、core が返す作った順に出す。トップやアバターが読む `currentPlayer` の `me` には含めず、このページだけで `me { decks }` を読む）・`/decks/[id]`（デッキの表示。合計の枚数と、カード（名前・種類・枚数。種類 → 名前の順は core が並べる）を出す。自分のデッキでない ID は「見つかりません」。game#33）、`/rooms`（自分の部屋の一覧。新しい順に名前（詳細へのリンク）・状態・席の数・ボードを出し、名前を入れて「部屋を作る」で作って詳細へ移る。続きは URL の `after`。アバターかデッキが無ければ、作るフォームの代わりに、core の `me { roomRequirements }`（足りないもの）だけで「部屋を作る前に」と、足りないもの（アバターを作る → /avatars、デッキを受け取る → /decks）のリンクを出す。画面で数えない。game#43）・`/rooms/[id]`（部屋の詳細。名前・状態・参加者の準備完了・席（種類・選んだアバターとデッキ）・対戦ルールを出し、操作は Server Action（app/rooms/[id]/actions.ts。操作の GraphQL は app/rooms/operations.ts）。フォーム・ボタンの出し分けは、core が見ている人について返す `Room.capabilities`（changeSeats・changeMatchRules・publish・declareReady・declareNext・resume・close・rename）と `RoomSeat.choiceChangeable` だけで決め、担当・公開前に決めたものの固定・準備完了の条件を画面で判断しない（core の Decide と同じ関数で判断した値のため）。選べるものは、席の数（人数の範囲は `gameRules` の minPlayers〜maxPlayers。プレイヤーの席は自分の 1 つで残りは NPC）・対戦ルール（`Player.boards` から選び、7 つの値は選んだボードの `defaultRules` から始めて、ボードを選び直したら既定に戻す）・席のアバターとデッキ（プレイヤーの席は `Player.avatars`・`Player.decks`、NPC の席は `Player.npcAvatars` とそのデッキ）・名前の変更。core の型つきの誤り（`RevisionConflictError` 等）は文言で出す。フォームに `key={room.revision}` を付けて保存後に初期化すると、保存した直後のフォームが二重に残ったため（開発環境で再現）、付けない。game#17。準備完了が成功したら、Room.match が出るまで短く読み直して（app/rooms/[id]/wait-match.ts。declareRoomReady は対戦の ID を返さず、Room.match は投影から読むため。最大 3 秒）`/matches/[id]` へ移す。見出しの下に「部屋の一覧へ」と、対戦があれば「対戦の画面へ」のリンクを出す（読み直しが間に合わなかったときの逃げ道。game#20）。Room.match は次の対戦を始めるまで終わった対戦のままなので、準備完了の前の対戦の ID を控え、それと違う ID が出るまで待つ。対戦が終わって全員が戦利品を受け取ると「次を決める」になり、参加者ごとの意思表示（「まだ」「続ける」「終える」）と、「続ける」「終える」のボタン（`declareRoomNext`）を出す。全員が続けると準備中に戻り、条件を決め直して次の対戦を始める。誰かが終えると休止中になり（閉じない。一覧に残る）、作った人が「再開する」（`resumeRoom`）で準備中に戻す（どちらも core が決める。閉じるのは「部屋を閉じる」だけ）。この部屋の対戦（`Room.matches`。始めた順に「n 戦目」で、対戦の画面へのリンク）も出す。game#42）・`/matches/[id]`（対戦の画面。core の `match(id)` が返す今の状態（ラウンド・今の番・段階・サイコロの目・残りの歩数・参加者（core の turnOrder の小さい順。コマの番号（席の添字 + 1）・種類・アバター・魔力・位置・通ったチェックポイントの数・手札・山札の残り）・盤面・ルール）をそのまま出す。自分の番のときだけ、段階に合う操作（引く・捨てる・振る・分かれ道を選ぶ・ターンを終える。Server Action で revision を添えて送り、結果にかかわらず読み直す）を出す。終わった対戦は結果の欄に振り返り（core の ranks の順位・勝った人・理由・ラウンドの数・参加者ごとの最後の魔力と戦利品。並びは core の順位の値で並べるだけで、順位を画面で決めない）と、自分が選べる戦利品のパック（`rewardPacks`）のボタン（`chooseMatchRewardPack`）を出す（game#19）。見出しに何戦目か（`Match.number`）を出す。NPC の番は「NPC の番です」だけ（Subscription がつながっていないときだけ、読み直すリンクも出す）。進みは app/matches/[id]/match-live.tsx が Subscription `matchProgress`（SSE）で受け取り、読んだ版より進んでいれば、Server Action `loadMatchEvents`（`matchEvents(after)`）で差分を読んで、開いた時点の版より後のイベントを（自分の操作の分も）一定の間隔で 1 つずつ見せる（開いた時点までは欄に入れるだけ）。見せる間に変えるのは MatchMovedEvent のコマの位置だけで（画面の版と描画済みの版が違う間は描画済みの位置を出す。操作の後の読み直しが先に最後の位置を出してから途中に戻るちらつきを防ぐため）、状態をイベントから組み立て直さず（決まりを 2 か所に書かないため）、描き終えたら `router.refresh()` で core の今の状態を出す。右の列の下の「描画したイベント」の欄は、版の番号・誰が・何をしたかを新しい順に並べるデバッグ用の暫定の UI（1 行の文言は app/matches/match-events.ts と messages.ts の MATCH_EVENT_MESSAGES）。SSE のほどき方は app/matches/sse.ts（graphql-sse は標準の fetch で足りるため足さない）。盤面は BoardGrid にコマ（席の番号）を重ねる。見出しの下（盤面の上）に「部屋に戻る」（`Match.roomId` の部屋の詳細へ。投影の遅れで null の間は出さない。game#42）と「部屋の一覧へ」を置く。広い画面は左に盤面、右に今の状態（5 項目を横に wrap）・操作か結果（1 行。ボタンも wrap）・参加者（1 人を数行に詰め、今の番の行に印）・ルール（組を横に wrap）を並べ、狭い画面は縦に積む（inline style の auto-fit と flex の wrap だけで切り替える）。参加していない・無い・形の違う ID は「見つかりません」。game#18・game#20）、`/login`・`/signup`・`/forgot-password`・`/reset-password`、`/api/auth/[...all]` は better-auth） |
| lib/auth.ts | better-auth の設定（サーバー側）。公式どおり `export const auth = betterAuth(...)`。CLI もこれを読む |
| lib/auth-client.ts | better-auth のクライアント |
| lib/core.ts | core の GraphQL を呼ぶ道具（`callCore`。JWT は `auth.api.getToken`。core に届かないときは `{ ok: false, reason: "unavailable" }` を返し、401 はログイン画面へ。studio の lib/core.ts と同じ形） 例外は対戦の Subscription（`matchProgress`）だけで、ブラウザが同じ入口の `/game/graphql` へ直接つなぐ（JWT はブラウザが `/api/auth/token` で取る）。長い通信を Next.js で中継すると、game のサーバーが接続の数だけ抱えるため。差分の query は今までどおり game のサーバーから呼ぶ。envoy の `/game/graphql` の経路は、応答全体の長さの上限（既定 15 秒）を `timeout: 0s` で外している（local/envoy/envoy.yaml・relay-listener.yaml、ルートの envoy.yaml） |
| lib/player.ts | ログイン中のプレイヤー（アバターの一覧を含む）を確かめる `currentPlayer`（`me` を呼び、未登録なら `registerPlayer` を呼んで読み直す。React の `cache` で 1 リクエストの中は使い回す）。プレイヤーの情報を出すページだけで呼び、ログイン等の core を使わないページでは呼ばない |
| graphql | `make gen-api` が作る生成物（core から取り出したスキーマ `schema.graphql` と graphql-codegen の型）。手で直さない。コミットする（CI に core が無くても型の検査が通るように） |
| codegen.ts・.graphqlrc.yaml | graphql-codegen の設定と、VSCode の GraphQL の拡張の設定（studio と同じ） |
| lib/search-params.ts | ページの `searchParams` の値を 1 つにする `first`（studio の lib/search-params.ts から使うものだけ写した） |
| lib/mail.ts | SMTP でのメール送信（`sendMail`） |
| lib/use-hydrated.ts | フォームをハイドレーションの後まで送信させないための印（better-auth のクライアントを呼ぶ認証の画面で使う） |
| instrumentation.ts | OpenTelemetry（`@vercel/otel` の `registerOTel`）。送り先は標準の環境変数（`OTEL_EXPORTER_OTLP_ENDPOINT` 等）で渡し、任意（無ければ送らない）。core を呼ぶ fetch に traceparent を付けるため、`propagateContextUrls` に `CORE_GRAPHQL_URL` を渡す（既定では同じ宛先にしか付かず、トレースが core で切れる）。パッケージは @vercel/otel のほか、同梱の文書が一緒に入れるよう書いている @opentelemetry/sdk-logs・api-logs・instrumentation（@vercel/otel の peer。版は peer の範囲 <0.300 の最新に固定）。開発・テスト用の環境は core の compose の otel-lgtm（ホストの 4318）に送る（`extra_hosts` の host.docker.internal。共有ネットワークには入れない）。見方は README の「トレース」（game#25。studio#50 の写し） |
| proxy.ts | 未ログインのときにログイン画面へ移す（Next.js 16 の proxy。Cookie の有無だけを見る） |
| migrations | DB マイグレーション（`NNNN_name.sql` + `atlas.sum`）。better-auth のテーブルも `auth generate` で SQL にしてここに置き、Atlas で適用する |
| local/migrate | マイグレーション用イメージ（Atlas Community + migrations。core と同じ構成） |
| scripts/check-migrations.sh | Atlas が検出しない migrations の違反の検査（core と同じものを置く。変えるときは core / studio と揃える） |
| scripts/check-auth-schema.sh | better-auth の設定と DB（DATABASE_URL）のスキーマに差分が無いことの検査（マイグレーションの作り忘れを防ぐ） |
| scripts/save-test-failure.sh | `make test` が落ちたときに、テスト用の環境を消す前に記録（test-results・ログ・DB の中身・落ちたテストのトレースとログ）を test-failures/ に移す |
| scripts/seed.ts | 開発・テスト用の、メールアドレスを確認済みのプレイヤーを作る（`pnpm db:seed`） |
| tests | Playwright のテスト |
| `*.test.ts`（app/ 配下） | `node --test` の単体テスト。調べる元のファイルの隣に置く（boards/board-layout.test.ts・boards/board-view.test.ts・boards/board-paint.test.ts）。本番用イメージのビルドには入れない（.dockerignore） |
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
- ほかの画面へ移るリンク（一覧へ・トップへ・部屋に戻る等）は、見出しのすぐ下に置く。中身（一覧・イベントの欄・振り返り）が伸びても位置が変わらず、押しにくくならないため（2026-11-06 オーナー。今は部屋の詳細と対戦の画面だけ。ほかの画面は後でそろえる）
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
- テスト用の環境の game は、起動の確かめ（healthcheck）で better-auth の入口（`/api/auth/ok`）を読み、その部品の読み込みをテストの前に済ませる（固定のファイルを読む形だと、最初のログインに読み込みが重なり、表示を待つ上限の 5 秒を超えて落ちたことがあるため。game#31）。開発の環境の compose.yaml も同じ
- テストは開発用イメージの game-test-runner（profile: runner）から `docker compose run` で実行する。本番用イメージにはテストコードを含めない
- テストの基準（game#23。studio#47 と同じ）。E2E（Playwright）は遅く、機能を足すたびに増えるため、次に絞る。そのほかは単体テストで確かめる
  - E2E に残すもの: 画面ごとの主な流れを 1 本ずつ（core まで通して操作が届き、画面が最新を出し直す）、層をまたぐ約束、本物のブラウザでしか確かめられないもの（ドラッグ・拡大縮小・認証やメールの流れ）
  - 単体テストにするもの: 純粋な関数の決まり（番号の振り方・マスの名前・並びや色の対応）。core が判定する決まりそのものは core のテストに任せ、画面では core の結果が表示になることを確かめる
  - 同じ画面の流れを重ねて確かめない。流れが重なるテストは 1 本にまとめ、テスト名で何を保証するかがわかるようにする
  - 見た目（色）は自動のテストにせず、目で確かめる（色の定数と塗り分けの対応は単体テストで保証する）
  - E2E から外したテストは、何で確かめるようになったか（単体テスト・残した E2E・確かめなくてよい理由）を MR に一覧で書く
- 単体テストは Node 組み込みの `node --test`（Node 26 は型を取り除いて .ts をそのまま読む）で、`describe`/`it` と `node:assert/strict` を使う。標準で足りるのでパッケージは足さない。`pnpm test:unit` で流し（`app/**/*.test.ts`）、`make test` の最初に `make test-unit`（テスト用のランナーのコンテナだけを `--no-deps` で一度動かす。core・DB・ブラウザは起動しない）を流して、落ちたら E2E の環境を起動せずに止める。CI の check のジョブでも流す。`make lint` では流さない
- 単体テストは調べる元のファイルの隣に `*.test.ts` で置く。JSX を含む `.tsx` は Node が読めないため、部品の中の純粋な関数は `.ts` に出してから単体テストにする（board-view.ts・board-paint.ts。振る舞いは変えない）
- 単体テストで読むファイル（とそこから値を import するファイル）は、値の相対 import に `.ts` の拡張子を付ける（tsconfig の `allowImportingTsExtensions` で許している。Node は拡張子を補わないため）。型だけの import（`import type`）は消えるので、そのままでよい。`@/` で値を import しているファイルは Node が解決できないため、単体テストで読むなら相対パスにする。単体テストで読まない `.tsx` は拡張子を付けない
- Playwright のブラウザは game-playwright コンテナ（公式イメージ）で動く。game コンテナから `run-server` に接続して実行する
- baseURL は `http://game-envoy:10001`（テスト用の環境だけにある中継役用の入口。公開の入口は `PLAYWRIGHT_PUBLIC_URL`）
- `run-server` は game の node_modules の `@playwright/test` を Playwright のコンテナに読み取り専用で渡して起動する（npx で起動のたびに npm から取ってこない。npm に届かないとサーバーが立たないため。studio#25）。`@playwright/test`（package.json）と compose の Playwright イメージのバージョンは一致させる
- テストは tests/fixtures.ts の `test` / `expect` を使う。テストごとに `X-Forwarded-For` で別の IP を名乗り、本番モードのレート制限（ログインは同じ IP から 10 秒に 3 回）でほかのテストと枠を共有しないようにしている。名乗った IP が効くのは、テスト用の環境だけにある中継役用の入口（envoy の 10001。`PLAYWRIGHT_BASE_URL`）を通るとき。公開の入口は `PLAYWRIGHT_PUBLIC_URL`
- `make test` のテスト用のプレイヤーは seed（player@example.com。パスワード付き・確認済み）。ほかのアカウントはテストの中でサインアップし、Mailpit の確認のメールで確認する（tests/account.ts）
- 落ちたテストだけ Playwright が trace とスクリーンショットを残し、HTML のレポート（playwright-report/。自動では開かない）にすべてのテストの結果と trace id（注記）を出し（playwright.config.ts）、`make test` が落ちたときだけ、テスト用の環境を消す前に scripts/save-test-failure.sh が test-results・HTML のレポート・各コンテナのログ・各 DB の中身（pg_dump）を `test-failures/<日時>/`（git 管理しない）に移す。見方は README の「テストが落ちたとき」。テストごとに tests/fixtures.ts が W3C の traceparent を作り、ブラウザの通信と `request`（`extraHTTPHeaders`。core を直接呼ぶ tests/core-jwt.spec.ts もこれで付く）に付けるため、落ちたテストは `test-results/<テスト>/trace-id.txt` に trace id を残し、save-test-failure.sh が core の compose の otel-lgtm（Grafana の API。GRAFANA_URL、既定 http://127.0.0.1:3002）から Tempo のトレースと Loki のログ（trace_id で引く。保存のログも、投影・ポリシーの処理のログも、保存したときの trace_id を持つ。core#76）を `traces/<trace id>/` に JSON で保存する（受け手が止まっていれば飛ばす。終了コードは変えない。AI に調べさせるときは `test-failures/<日時>/` を渡し、記録に無いことは Grafana の API で引く（README の「テストが落ちたとき」）。game#26。studio#51 の写し）。retries は付けない（流し直しで通ると、たまに落ちることが隠れるため）。たまに落ちるテストは再現を探さず、起きたときにこの記録で調べる（投影の遅れで待ちきれなかっただけか、イベントと read model で確かめる。game#22・studio#46）
- メールは Mailpit が受け止め、テストは Mailpit の API で読む（tests/mail.ts）。メールのリンクのホスト名は BETTER_AUTH_URL のため、パスだけを使う（開発用の環境では localhost:3000 で、ブラウザのコンテナから届かない）
- core_game のマスタ（公開中のカード・配布デッキ 2 つ・スターターセット（配るデッキは 2 つとも）・game_rules・ボード（公開中 3 つと使用不可 1 つ。公開中 C に転送円の対 2 つ・橋の対 1 つ・施設 4 つを置く）・NPC のアバター（公開中 3 つと使用不可 1 つ。スターターセットが解放するのは 森の番人 → 使用不可 → 炎の剣士 で、未解放の NPC は解放しない。解放するボードは 公開中A だけ（部屋の対戦ルールで選べる））と、それに割り当てた NPC のデッキ（公開中 2 つと使用不可 1 つ。core の make publish-master と同じく、割り当てたものだけ））は、core-publish-master（compose.test.yaml の使い捨ての psql）が `local/core-master/master.sql` を流して入れる。カード・ボード・NPC のアバター・NPC のデッキの game の内部 ID（domain_entities の行。配布の流れが配るカードと解放するもの、部屋が選ぶ NPC のデッキを指す。core#94 からカードも要る）は、core が種類の表を作ってから core-publish-entities が `local/core-master/entities.sql` で作る（runner の依存。core の healthy に依存させると runner の run が core-publish-master を流し直して落ちる）。core の `make publish-master`（studio の read model から写す）と同じ形の行で、形を変えるときは ../core の migrations と tests/testhelper/master.go に合わせる（ボードの metadata は studio の read model の BoardMetadata の形で、kind・attribute は小文字（kind は prophecy_shop 等 snake_case）。default_rules（round_limit・dice_min・dice_max を含む 7 項目）・tile_counts は snake_case で tile_counts は 15 項目すべてを書く。pairs（無ければ `[]`）も必ず書く。core は無い行を読み出しの誤りにするため。土地のマスだけが attribute を持つ）。core はこれが済んでから起動するため、登録すればスターターが配られる
- tests/core-jwt.spec.ts は、サインアップしたばかりのプレイヤーの JWT で core の `me` を呼び、`PlayerNotRegisteredError` が返ることで、core が game の JWT を受け付けることを確かめる。画面でログインするとトップが登録してしまうため、API でログインする。seed のプレイヤーは tests/player.spec.ts が登録するので使わない
- tests/player.spec.ts は、トップを開くと core に登録されてスターターを受け取ること（受け取り中は再読み込みして待つ）、もう一度開いても登録が重ならないことを確かめる。core に届かないときの表示は自動のテストにしない（studio と同じ）
- tests/avatar.spec.ts は、アバターの画面（/avatars）で、作ると一覧に作った順で出ること、名前の誤り（空・長すぎる）、同じ名前は作れず入力した値が残ること、6 体目は作れないことを確かめる。作る数が絡むため、テストごとに新しくサインアップしたプレイヤーを使い、共有の seed のプレイヤーは使わない。core に届かないときの表示は自動のテストにしない
- tests/boards.spec.ts は、ボードの一覧（/boards）に公開中のボードが名前の順に出て使用不可は出ないこと、一覧にマスの数（特殊なマスを含む）と既定のルールが出ること、ボードの詳細（/boards/[id]）に既定のルールが出ること、ボードの表示でマスの種類（土地は属性つき）とマスの無い所を描かないこと・凡例の 14 個の並び、拡大・縮小・全体を表示で倍率（data-scale）が変わること、使用不可・無い・形の違う ID のボードが「見つからない」になることを確かめる（6 本）。転送円・橋の対の番号、施設の 1 文字、色の対応は単体テスト（board-layout.test.ts・board-paint.test.ts）で確かめる。seed のプレイヤーで読むだけ（登録は同じプレイヤーで何度行っても重ならない）
- tests/npc-avatars.spec.ts は、NPC の一覧（/npc-avatars）に解放した公開中の NPC が解放した順に、使う公開中のデッキ（割り当てた順。使用不可のデッキは出ない）と一緒に出て未解放・使用不可の NPC は出ないこと、詳細（/npc-avatars/[id]）に割り当てた順のデッキごとにカードと枚数が出ること、未解放・使用不可・無い・形の違う ID が「見つからない」になることを確かめる（3 本）。seed のプレイヤーで読むだけ
- tests/decks.spec.ts は、新しくサインアップしたプレイヤーがスターターを受け取ったあと、デッキの一覧（/decks）に火・水のデッキが合計の枚数と種類ごとの枚数つきで出ること、詳細（/decks/[id]）にカードと枚数が出て、無い・形の違う ID が「見つからない」になることを確かめる（2 本。配られた直後は投影の遅れで出ないことがあるため、出るまで再読み込みして待つ）
- tests/rooms.spec.ts は、新しくサインアップしてアバターを作ったプレイヤーで、名前を入れて部屋を作り、席の数・対戦ルール（選んだボードの既定のルールから始まる）・席のアバターとデッキを決めて公開すると準備中になり、公開前に決めたものの操作が消えて準備完了にできること、公開前に決めなかったものを準備中に決めるまで準備完了が出ないこと（操作の出し分けは core の capabilities）、名前の誤り（長すぎる・空白だけ）が作るときも変えるときも文言で出て、変えると詳細と一覧に反映されること、対戦ルールの誤りが項目の文言で出ること、別の画面で変わっていると読み直しの案内が出ること、閉じると一覧から消えて操作が出なくなること、無い・形の違う ID が「見つからない」になること、準備完了で対戦の画面に移り、ラウンド 1・今の番・順番・全員が拠点・開始時の魔力・配った手札・山札の残り・盤面のコマ・ルールが出て、部屋に「対戦中」と「対戦の画面へ」のリンクが出て、ほかのプレイヤーにはその対戦が「見つからない」になることを確かめる、アバターが無いと作るフォームの代わりに先にアバターを作る案内が出て、作るとフォームが出ること（8 本。部屋を作れるのはデッキが届いてからなので、tests/room-flow.ts の `openNewRoom` は作るフォームが出るまで読み直して待つ）。tests/matches.spec.ts は、ラウンドの上限 1 で始めた対戦を、画面の操作だけ（引く・捨てる・振る・ターンを終える）で読み直さずに終わりまで進め（NPC の番は Subscription で描画される）、操作が消えて勝った人と理由・振り返りの順位・ラウンドの数が出て、パックを選ぶと引いたカードが出て選ぶボタンが消え、描画したイベントの欄に NPC の進みと戦利品が出て、部屋に戻ると次を決める状態になり、続けると準備中に戻って条件を変え直して 2 戦目を遊べ、部屋の対戦に 2 戦が始めた順に並び、2 戦目のあとに終えると休止中になって一覧に残り、一覧から開いて再開すると準備中に戻ることを確かめる（1 本。テスト用のボードに分かれ道が無いため、分かれ道を選ぶ操作は E2E に無い）。NPC が先の順番だと開いた時点で NPC の番が済んでいるため、始めの状態を確かめるのはプレイヤーの分だけ。解放したボード・配られたデッキは投影の遅れで選べないことがあるため、選べるまで再読み込みして待つ

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
