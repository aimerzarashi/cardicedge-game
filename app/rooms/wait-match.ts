import "server-only";
import { callCore } from "@/lib/core";
import { roomMatchQuery } from "./operations";

// 対戦を作るのは部屋のイベントを受けたポリシー（core の match_start）で、部屋の版より後になる。Room.match は対戦の集約が
// 作られるまで null のため、部屋が対戦中でも 1 回読むだけでは出ないことがある（ポリシーの処理に数十 ms。make test で起きた。
// game#99）。部屋が対戦中のときだけ、準備完了の前と違う対戦が出るまで読み直す（上限と間隔は wait-room.ts と同じ）
const TIMEOUT_MS = 3_000;
const INTERVAL_MS = 50;

export async function waitStartedMatch(
  id: string,
  previousId: string | undefined,
): Promise<string | undefined> {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const result = await callCore(roomMatchQuery, { id });
    if (!result.ok || result.data.room.__typename !== "Room") {
      return undefined;
    }
    const { status, match } = result.data.room;
    // 対戦中でなければ、ほかのプレイヤーの準備完了を待っている
    if (status !== "PLAYING") {
      return undefined;
    }
    if (match && match.id !== previousId) {
      return match.id;
    }
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
  return undefined;
}
