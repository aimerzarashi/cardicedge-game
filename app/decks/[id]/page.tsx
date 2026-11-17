import Link from "next/link";
import { graphql } from "@/graphql";
import { callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import { CARD_SPEC_HEADERS, CardSpecCells } from "../../card-spec-cells";
import { CARD_TYPE_LABELS, RARITY_LABELS } from "../../messages";

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
            __typename
            id
            name
            cost
            rarity
            ... on CreatureCardInfo {
              elements
              attack
              hitPoints
              itemRestrictions
              placementRestrictions
              effects {
                __typename
                kind
                ... on AttackModifierEffect {
                  value
                }
                ... on HitPointsModifierEffect {
                  value
                }
                ... on AttackOverrideEffect {
                  minimum
                  maximum
                }
                ... on HitPointsOverrideEffect {
                  minimum
                  maximum
                }
                ... on AttackMultiplierEffect {
                  percent
                  constraints {
                    kind
                    ... on OpponentCreatureElementConstraint {
                      elements
                    }
                  }
                }
                ... on NullifyReceivedDamageEffect {
                  constraints {
                    kind
                    ... on OpponentCreatureElementConstraint {
                      elements
                    }
                  }
                }
                ... on TollMultiplierEffect {
                  percent
                }
                ... on ReturnToHandOnDestructionEffect {
                  destructions
                }
                ... on GainMagicOnDestructionEffect {
                  destructions
                  amount
                }
                ... on UseCreatureAsItemEffect {
                  elements
                }
              }
            }
            ... on ItemCardInfo {
              category
              effects {
                __typename
                kind
                ... on AttackModifierEffect {
                  value
                }
                ... on HitPointsModifierEffect {
                  value
                }
                ... on AttackOverrideEffect {
                  minimum
                  maximum
                }
                ... on HitPointsOverrideEffect {
                  minimum
                  maximum
                }
                ... on AttackMultiplierEffect {
                  percent
                  constraints {
                    kind
                    ... on OpponentCreatureElementConstraint {
                      elements
                    }
                  }
                }
                ... on NullifyReceivedDamageEffect {
                  constraints {
                    kind
                    ... on OpponentCreatureElementConstraint {
                      elements
                    }
                  }
                }
                ... on TollMultiplierEffect {
                  percent
                }
                ... on ReturnToHandOnDestructionEffect {
                  destructions
                }
                ... on GainMagicOnDestructionEffect {
                  destructions
                  amount
                }
                ... on UseCreatureAsItemEffect {
                  elements
                }
              }
            }
            ... on SpellCardInfo {
              effect {
                __typename
                ... on DrawCardsSpellEffect {
                  count
                }
                ... on GainMagicSpellEffect {
                  perLap
                }
                ... on MultipleDiceSpellEffect {
                  count
                  turns
                }
                ... on FixedDiceSpellEffect {
                  value
                  turns
                }
                ... on DamageSpellEffect {
                  amount
                }
              }
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
      <h1>デッキ</h1>
      <p>
        <Link href="/decks">デッキの一覧へ</Link>
      </p>
      <p role="alert">このデッキは見つかりません</p>
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
      <p>
        <Link href="/decks">デッキの一覧へ</Link>
      </p>
      <p>合計 {deck.totalCount} 枚</p>
      <table>
        <thead>
          <tr>
            <th>カード名</th>
            <th>種類</th>
            <th>コスト</th>
            <th>希少度</th>
            {CARD_SPEC_HEADERS.map((header) => (
              <th key={header}>{header}</th>
            ))}
            <th>枚数</th>
          </tr>
        </thead>
        <tbody>
          {deck.cards.map(({ card, count }) => (
            <tr key={card.id}>
              <td>
                <Link href={`/cards/${card.id}`}>{card.name}</Link>
              </td>
              <td>{CARD_TYPE_LABELS[card.__typename]}</td>
              <td>{card.cost}</td>
              <td>{RARITY_LABELS[card.rarity]}</td>
              <CardSpecCells card={card} />
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
