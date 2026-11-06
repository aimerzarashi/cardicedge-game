import "server-only";
import { callCore } from "@/lib/core";
import { roomRevisionQuery } from "./operations";

// 投影の遅れはふつう数十 ms のため、1〜2 回で届く。届かないのは投影が止まっているときなので、長くは待たない（wait-avatar.ts と同じ）
const TIMEOUT_MS = 3_000;
const INTERVAL_MS = 50;

// core の部屋の操作の結果は id と revision だけで、詳細（Room）は投影から読む。操作の直後に読み直すと反映前の中身が出て
// （game#45: 席を決めたのに「未定」のまま）、その revision のまま次の操作をすると「先に変えられた」になるため、
// 詳細が操作の結果の revision に届くまで読み直す。作った直後は、届くまで詳細が「見つからない」になる
export async function waitRoom(
  id: string,
  revision: number,
): Promise<"reached" | "timeout"> {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const result = await callCore(roomRevisionQuery, { id });
    if (
      result.ok &&
      result.data.room.__typename === "Room" &&
      result.data.room.revision >= revision
    ) {
      return "reached";
    }
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
  return "timeout";
}
