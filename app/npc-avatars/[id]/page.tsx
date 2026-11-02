import Link from "next/link";
import { graphql } from "@/graphql";
import { callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import { CARD_TYPE_LABELS } from "../../messages";

const npcAvatarQuery = graphql(`
  query NpcAvatar($id: UUID!) {
    npcAvatar(id: $id) {
      __typename
      ... on NpcAvatar {
        id
        name
        decks {
          id
          name
          totalCount
          cards {
            count
            card {
              id
              name
              type
            }
          }
        }
      }
    }
  }
`);

// 形の違う ID を core に渡すと GraphQL の誤りになり、想定外として扱われるため、形だけを確かめる
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function NotFound() {
  return (
    <main>
      <h1>NPC</h1>
      <p role="alert">この NPC は見つかりません</p>
      <p>
        <Link href="/npc-avatars">NPC の一覧へ</Link>
      </p>
    </main>
  );
}

export default async function NpcAvatarPage({
  params,
}: PageProps<"/npc-avatars/[id]">) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return <NotFound />;
  }

  // 未登録のプレイヤーは core の npcAvatar が PlayerNotRegisteredError を返すため、先に登録を済ませる
  const player = await currentPlayer();
  const result = player.ok ? await callCore(npcAvatarQuery, { id }) : player;
  if (!result.ok) {
    return (
      <main>
        <h1>NPC</h1>
        <p role="alert">
          core に接続できません。時間をおいて再読み込みしてください。{" "}
          <Link href={`/npc-avatars/${id}`}>再読み込み</Link>
        </p>
      </main>
    );
  }
  const avatar = result.data.npcAvatar;
  switch (avatar.__typename) {
    case "PlayerNotRegisteredError":
      // 登録の直後に未登録のままなのは、core の不具合（想定外）
      throw new Error("player is not registered after registerPlayer");
    case "NpcAvatarNotFoundError":
      return <NotFound />;
    case "NpcAvatar":
      break;
  }

  return (
    <main>
      <h1>{avatar.name}</h1>
      {avatar.decks.length === 0 && <p>使うデッキがありません</p>}
      {avatar.decks.map((deck) => (
        <section key={deck.id} aria-labelledby={`deck-${deck.id}`}>
          <h2 id={`deck-${deck.id}`}>{deck.name}</h2>
          <p>合計 {deck.totalCount} 枚</p>
          <table>
            <thead>
              <tr>
                <th>カード名</th>
                <th>種類</th>
                <th>枚数</th>
              </tr>
            </thead>
            <tbody>
              {deck.cards.map(({ card, count }) => (
                <tr key={card.id}>
                  <td>{card.name}</td>
                  <td>{CARD_TYPE_LABELS[card.type]}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <p>
        <Link href="/npc-avatars">NPC の一覧へ</Link>
      </p>
    </main>
  );
}
