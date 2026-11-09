import { createSseParser, progressSignal } from "../../sse";

// 切れた（時間切れ・JWT の期限・ネットワーク）あと、つなぎ直すまでの待ち
const RECONNECT_WAIT_MS = 1000;

const PROGRESS_QUERY =
  "subscription MatchProgress($id: UUID!) { matchProgress(id: $id) { __typename ... on MatchProgress { revision } } }";

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
export async function watchProgress(
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
