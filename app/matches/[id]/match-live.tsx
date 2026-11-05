"use client";

import { useRouter } from "next/navigation";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BoardGrid } from "../../boards/board-grid";
import {
  appendNew,
  eventLine,
  type MatchEventView,
  mergeShown,
  movedPiece,
  splitEvents,
} from "../match-events";
import { createSseParser, progressSignal } from "../sse";
import { loadMatchEvents } from "./actions";

// コマを 1 つ動かしてから次のイベントを見せるまでの間隔
const EVENT_INTERVAL_MS = 300;
// 切れた（時間切れ・JWT の期限・ネットワーク）あと、つなぎ直すまでの待ち
const RECONNECT_WAIT_MS = 1000;
// 差分の読み込みに失敗したあと、読み直すまでの待ち
const LOAD_RETRY_MS = 2000;

const PROGRESS_QUERY =
  "subscription MatchProgress($id: UUID!) { matchProgress(id: $id) { __typename ... on MatchProgress { revision } } }";

// メディアクエリは inline style で書けないため、auto-fit だけで、広い画面は盤面と情報を横に並べ、狭い画面は縦に積む
const COLUMNS_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 36rem), 1fr))",
  gap: "1rem",
  alignItems: "start",
} as const;
const LIST_STYLE = { margin: 0, padding: 0, listStyle: "none" } as const;

const ConnectedContext = createContext(false);

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

// ブラウザから /game/graphql へ直接つなぐ（game のサーバーで中継すると、長い通信を接続の数だけ抱えるため）。
// JWT は better-auth の入口で、Cookie のセッションからもらう。つなぐたびに取り直すので、期限が切れて切れても
// つなぎ直せば新しいものになる。complete（対戦が終わった・無い・参加していない）で閉じたときだけ、つなぎ直さない
async function watchProgress(
  id: string,
  signal: AbortSignal,
  onProgress: (revision: number) => void,
  onConnected: (connected: boolean) => void,
) {
  while (!signal.aborted) {
    let closed = false;
    try {
      const tokenResponse = await fetch("/api/auth/token", {
        cache: "no-store",
        signal,
      });
      if (!tokenResponse.ok) {
        throw new Error(`token status ${tokenResponse.status}`);
      }
      const { token } = (await tokenResponse.json()) as { token: string };
      const response = await fetch("/game/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: PROGRESS_QUERY, variables: { id } }),
        cache: "no-store",
        signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`progress status ${response.status}`);
      }
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      const parser = createSseParser();
      while (!closed) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const message of parser.push(value)) {
          const signalled = progressSignal(message);
          if (signalled.kind === "progress") {
            onConnected(true);
            onProgress(signalled.revision);
          } else if (signalled.kind === "closed") {
            closed = true;
          }
        }
      }
    } catch {
      // 切れたあとの処理は下に任せる（abort のときは while を抜ける）
    }
    onConnected(false);
    if (closed) return;
    await sleep(RECONNECT_WAIT_MS, signal);
  }
}

// 対戦の画面の盤面と右の列。Subscription で進みを受け取り、差分のイベントを 1 つずつ見せる。
// 状態をイベントから組み立て直さない（決まりを 2 か所に書かないため）。描画の間に変えるのは MatchMovedEvent のコマの位置だけで、
// 描き終えたら読み直して、魔力・手札・段階などは core の今の状態で出す
export function MatchLive({
  id,
  revision,
  names,
  board,
  pieces,
  children,
}: {
  id: string;
  revision: number;
  names: string[];
  board: Omit<ComponentProps<typeof BoardGrid>, "pieces">;
  pieces: ComponentProps<typeof BoardGrid>["pieces"];
  children: ReactNode;
}) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  // Subscription で届いた最新の版
  const [target, setTarget] = useState(0);
  // matchEvents で読み終えた版（欄に入れた分と描画待ちの分の最後）
  const [fetched, setFetched] = useState(0);
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<MatchEventView[]>([]);
  const [shown, setShown] = useState<MatchEventView[]>([]);
  // 描画済みの版と、そのときのコマの位置（席ごと）。開いた時点の位置から始める
  const [drawn, setDrawn] = useState<{
    revision: number;
    bySeat: Record<number, { x: number; y: number }>;
  }>(() => ({
    revision,
    bySeat: Object.fromEntries(
      (pieces ?? []).map((piece, seat) => [seat, { x: piece.x, y: piece.y }]),
    ),
  }));

  // 開いた時点の版。それより後のイベントは、自分の操作の分も 1 つずつ描画する（操作の後の読み直しが先に最後の状態を出していても、
  // 移動を 1 マスずつ見せるため）
  const opened = useRef(revision);

  useEffect(() => {
    const controller = new AbortController();
    watchProgress(
      id,
      controller.signal,
      (next) => setTarget((current) => Math.max(current, next)),
      setConnected,
    );
    return () => controller.abort();
  }, [id]);

  // 届いた版か画面が出している版が、読んだ版より進んでいれば差分を読む。開いた時点の版までは欄に入れるだけで、それより後を描画の列に足す。
  // Subscription で届いたときに読む必要があり、Server Component の読み込みでは届いた時点で読めないため、ここだけ effect で読む
  useEffect(() => {
    const goal = Math.max(target, revision);
    if (loading || goal <= fetched) return;
    setLoading(true);
    loadMatchEvents(id, fetched).then((result) => {
      if (!result.ok) {
        setTimeout(() => setLoading(false), LOAD_RETRY_MS);
        return;
      }
      const events = result.events.filter((event) => event.revision > fetched);
      const { silent, play } = splitEvents(events, opened.current);
      setShown((current) => mergeShown(current, silent));
      setQueue((current) => appendNew(current, play));
      setFetched(events.at(-1)?.revision ?? goal);
      setLoading(false);
    });
  }, [id, target, revision, fetched, loading]);

  useEffect(() => {
    const head = queue[0];
    if (!head) return;
    const timer = setTimeout(() => {
      setQueue((current) => current.slice(1));
      setShown((current) => mergeShown(current, [head]));
      const piece = movedPiece(head);
      setDrawn((current) => ({
        revision: head.revision,
        bySeat: piece
          ? { ...current.bySeat, [piece.seat]: { x: piece.x, y: piece.y } }
          : current.bySeat,
      }));
      if (queue.length === 1) {
        router.refresh();
      }
    }, EVENT_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [queue, router]);

  // 画面の版と描画済みの版が違う間と、描画の列が残っている間は、描画済みの位置を出す。画面が先（操作の後の読み直しが差分より先に
  // 最後の位置を持ってきた）なら最後の位置が一瞬出てから途中に戻らないように、描画が先（読み直しがまだ届かない）なら古い位置に戻らないように
  const overriding = queue.length > 0 || revision !== drawn.revision;
  const shownPieces = pieces?.map((piece, seat) => ({
    ...piece,
    ...(overriding ? drawn.bySeat[seat] : undefined),
  }));

  return (
    <ConnectedContext value={connected}>
      <div style={COLUMNS_STYLE}>
        <BoardGrid {...board} pieces={shownPieces} />
        <div>
          {children}

          <h2>描画したイベント</h2>
          {shown.length === 0 ? (
            <p>まだありません</p>
          ) : (
            <ol data-testid="match-events" style={LIST_STYLE}>
              {[...shown]
                .sort((a, b) => b.revision - a.revision)
                .map((event) => (
                  <li key={event.revision}>{eventLine(event, names)}</li>
                ))}
            </ol>
          )}
        </div>
      </div>
    </ConnectedContext>
  );
}

// NPC の番の案内。進みが Subscription で見えているときは、読み直すリンクは要らない（つながっていないときの逃げ道だけ出す）
export function NpcTurnNotice({ id }: { id: string }) {
  const connected = useContext(ConnectedContext);
  return (
    <p style={{ margin: "0 0 0.5rem" }}>
      他の参加者（NPC）の番です。
      {!connected && (
        <>
          {" "}
          {/* Link は同じ URL だと読み直さないことがあるため、普通のリンクで読み込み直す */}
          <a href={`/matches/${id}`}>読み直す</a>
        </>
      )}
    </p>
  );
}
