import Link from "next/link";
import { graphql } from "@/graphql";
import type { PlayerDecksQuery } from "@/graphql/graphql";
import { callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";

// currentPlayer の me には含めない。含めると、トップやアバターなど、デッキを見せないページまで毎回デッキを読むため。
// 種類ごとの枚数は core が数えて返す（画面でカードから数えない）
const decksQuery = graphql(`
  query PlayerDecks {
    me {
      __typename
      ... on Player {
        decks {
          id
          name
          totalCount
          typeCounts {
            creature
            item
            spell
          }
        }
      }
    }
  }
`);

export default async function DecksPage() {
  // 未登録のプレイヤーは core の me が PlayerNotRegisteredError を返すため、先に登録を済ませる
  const player = await currentPlayer();
  const result = player.ok ? await callCore(decksQuery) : player;

  return (
    <main>
      <h1>デッキ</h1>
      {result.ok ? (
        <Decks me={result.data.me} />
      ) : (
        <p role="alert">
          core に接続できません。時間をおいて再読み込みしてください。{" "}
          <Link href="/decks">再読み込み</Link>
        </p>
      )}
      <p>
        <Link href="/">トップへ</Link>
      </p>
    </main>
  );
}

function Decks({ me }: { me: PlayerDecksQuery["me"] }) {
  if (me.__typename !== "Player") {
    // 登録の直後に未登録のままなのは、core の不具合（想定外）
    throw new Error("player is not registered after registerPlayer");
  }
  if (me.decks.length === 0) {
    return <p>まだデッキがありません</p>;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>名前</th>
          <th>合計</th>
          <th>内訳</th>
        </tr>
      </thead>
      <tbody>
        {me.decks.map((deck) => (
          <tr key={deck.id}>
            <td>
              <Link href={`/decks/${deck.id}`}>{deck.name}</Link>
            </td>
            <td>{deck.totalCount} 枚</td>
            <td>
              クリーチャー {deck.typeCounts.creature}・アイテム{" "}
              {deck.typeCounts.item}・スペル {deck.typeCounts.spell}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
