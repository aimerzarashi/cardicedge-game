import "server-only";
import { graphql } from "@/graphql";
import { callCore } from "@/lib/core";

const avatarIdsQuery = graphql(`
  query AvatarIds {
    me {
      __typename
      ... on Player {
        avatars {
          id
        }
      }
    }
  }
`);

// 投影の遅れは数 ms のため、ふつうは 1〜2 回で届く。届かないのは投影が止まっているときなので、長くは待たない
const TIMEOUT_MS = 3_000;
const INTERVAL_MS = 50;

// registerAvatar の結果は作ったアバターを返すが、一覧（me の avatars）は投影から読むため、直後に読むと
// 出ていないことがある。トップに移っても一覧に出ていない状態にならないよう、一覧に出るまで読み直す
export async function waitAvatar(id: string): Promise<"reached" | "timeout"> {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const result = await callCore(avatarIdsQuery);
    if (
      result.ok &&
      result.data.me.__typename === "Player" &&
      result.data.me.avatars.some((avatar) => avatar.id === id)
    ) {
      return "reached";
    }
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
  return "timeout";
}
