import "server-only";
import { cache } from "react";
import { graphql } from "@/graphql";
import type { StarterGrantStatus } from "@/graphql/graphql";
import { type CoreResult, callCore } from "@/lib/core";

const meQuery = graphql(`
  query Me {
    me {
      __typename
      ... on Player {
        id
        starterGrant
      }
    }
  }
`);

const registerPlayerMutation = graphql(`
  mutation RegisterPlayer {
    registerPlayer {
      __typename
    }
  }
`);

export type CurrentPlayer = { id: string; starterGrant: StarterGrantStatus };

// ログインのたびに core で登録済みかを確かめ、まだなら登録してから読み直す（game#7）。registerPlayer は何度呼んでも
// 同じプレイヤーを返すため、並行して 2 つのリクエストが登録しても重ならない。
// cache は 1 回のリクエストの中だけの使い回し（レイアウトとページが続けて呼んでも core を 1 度しか呼ばない）。
// core に届かないことは、呼ぶ側が表示できるよう、callCore と同じ CoreResult で返す
export const currentPlayer = cache(
  async (): Promise<CoreResult<CurrentPlayer>> => {
    let result = await callCore(meQuery);
    if (!result.ok) {
      return result;
    }
    if (result.data.me.__typename === "PlayerNotRegisteredError") {
      const registered = await callCore(registerPlayerMutation);
      if (!registered.ok) {
        return registered;
      }
      result = await callCore(meQuery);
      if (!result.ok) {
        return result;
      }
    }
    const me = result.data.me;
    if (me.__typename !== "Player") {
      // 登録の直後に未登録のままなのは、core の不具合（想定外）
      throw new Error("player is not registered after registerPlayer");
    }
    return { ok: true, data: { id: me.id, starterGrant: me.starterGrant } };
  },
);
