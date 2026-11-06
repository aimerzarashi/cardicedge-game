import Link from "next/link";
import { graphql } from "@/graphql";
import type { NpcAvatarsQuery } from "@/graphql/graphql";
import { callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";

// currentPlayer の me には含めない。含めると、NPC を見せないページまで毎回 NPC を読むため。
// 解放した NPC だけが返る（全員の一覧は無い）。数が少ないのでページ分けはしない
const npcAvatarsQuery = graphql(`
  query NpcAvatars {
    me {
      __typename
      ... on Player {
        npcAvatars {
          id
          name
          decks {
            id
            name
          }
        }
      }
    }
  }
`);

export default async function NpcAvatarsPage() {
  // 未登録のプレイヤーは core の me が PlayerNotRegisteredError を返すため、先に登録を済ませる
  const player = await currentPlayer();
  const result = player.ok ? await callCore(npcAvatarsQuery) : player;

  return (
    <main>
      <h1>NPC の一覧</h1>
      <p>
        <Link href="/">トップへ</Link>
      </p>
      {result.ok ? (
        <NpcAvatars me={result.data.me} />
      ) : (
        <p role="alert">
          core に接続できません。時間をおいて再読み込みしてください。{" "}
          <Link href="/npc-avatars">再読み込み</Link>
        </p>
      )}
    </main>
  );
}

function NpcAvatars({ me }: { me: NpcAvatarsQuery["me"] }) {
  if (me.__typename !== "Player") {
    // 登録の直後に未登録のままなのは、core の不具合（想定外）
    throw new Error("player is not registered after registerPlayer");
  }
  if (me.npcAvatars.length === 0) {
    return <p>まだ解放した NPC がいません</p>;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>名前</th>
          <th>使うデッキ</th>
        </tr>
      </thead>
      <tbody>
        {me.npcAvatars.map((avatar) => (
          <tr key={avatar.id}>
            <td>
              <Link href={`/npc-avatars/${avatar.id}`}>{avatar.name}</Link>
            </td>
            <td>{avatar.decks.map((deck) => deck.name).join("、")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
