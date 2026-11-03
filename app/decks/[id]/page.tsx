import Link from "next/link";
import { graphql } from "@/graphql";
import { callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import { CARD_TYPE_LABELS } from "../../messages";

const deckQuery = graphql(`
  query PlayerDeck($id: UUID!) {
    deck(id: $id) {
      __typename
      ... on Deck {
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
`);

// 形の違う ID を core に渡すと GraphQL の誤りになり、想定外として扱われるため、形だけを確かめる
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function NotFound() {
  return (
    <main>
      <h1>デッキ</h1>
      <p role="alert">このデッキは見つかりません</p>
      <p>
        <Link href="/decks">デッキの一覧へ</Link>
      </p>
    </main>
  );
}

export default async function DeckPage({ params }: PageProps<"/decks/[id]">) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return <NotFound />;
  }

  // 未登録のプレイヤーは core の deck が PlayerNotRegisteredError を返すため、先に登録を済ませる
  const player = await currentPlayer();
  const result = player.ok ? await callCore(deckQuery, { id }) : player;
  if (!result.ok) {
    return (
      <main>
        <h1>デッキ</h1>
        <p role="alert">
          core に接続できません。時間をおいて再読み込みしてください。{" "}
          <Link href={`/decks/${id}`}>再読み込み</Link>
        </p>
      </main>
    );
  }
  const deck = result.data.deck;
  switch (deck.__typename) {
    case "PlayerNotRegisteredError":
      // 登録の直後に未登録のままなのは、core の不具合（想定外）
      throw new Error("player is not registered after registerPlayer");
    case "DeckNotFoundError":
      return <NotFound />;
    case "Deck":
      break;
  }

  return (
    <main>
      <h1>{deck.name}</h1>
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
      <p>
        <Link href="/decks">デッキの一覧へ</Link>
      </p>
    </main>
  );
}
