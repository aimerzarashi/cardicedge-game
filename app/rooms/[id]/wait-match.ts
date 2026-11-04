import "server-only";
import { callCore } from "@/lib/core";
import { roomMatchQuery } from "../operations";

// 投影の遅れは数 ms のため、ふつうは 1〜2 回で届く。届かないのは、まだ全員がそろっていないとき（ほかのプレイヤーの待ち）か
// 投影が止まっているときなので、長くは待たない
const TIMEOUT_MS = 3_000;
const INTERVAL_MS = 50;

// declareRoomReady の結果は対戦の ID を返さず、Room.match は投影から読むため、直後に読むと出ていないことがある。
// 対戦の画面へ移せるよう、出るまで読み直す
export async function waitMatch(roomId: string): Promise<string | undefined> {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const result = await callCore(roomMatchQuery, { id: roomId });
    if (result.ok && result.data.room.__typename === "Room") {
      if (result.data.room.match) {
        return result.data.room.match.id;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
  return undefined;
}
