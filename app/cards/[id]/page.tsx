import Link from "next/link";
import { graphql } from "@/graphql";
import { callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import {
  CARD_TYPE_LABELS,
  elementsLabel,
  ITEM_CATEGORY_LABELS,
  itemBonusesLabel,
  RARITY_LABELS,
  spellEffectLabel,
} from "../../messages";

const cardQuery = graphql(`
  query Card($id: UUID!) {
    card(id: $id) {
      __typename
      ... on CardInfo {
        id
        name
        cost
        rarity
      }
      ... on CreatureCardInfo {
        elements
        attack
        hitPoints
        movement
      }
      ... on ItemCardInfo {
        category
        attackBonus
        hitPointsBonus
      }
      ... on SpellCardInfo {
        effect {
          __typename
          ... on SpellDrawCardsEffect {
            count
          }
          ... on SpellGainMagicEffect {
            perLap
          }
          ... on SpellRollDiceEffect {
            count
          }
        }
      }
    }
  }
`);

// 形の違う ID を core に渡すと GraphQL の誤りになり、想定外として扱われるため、形だけを確かめる
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 移ってきた一覧（所持カード・デッキ・NPC）はいくつもあるので、戻り先はトップと所持カードの一覧にする
function Navigation() {
  return (
    <p>
      <Link href="/">トップへ</Link>{" "}
      <Link href="/collection">所持カードへ</Link>
    </p>
  );
}

function NotFound() {
  return (
    <main>
      <h1>カード</h1>
      <Navigation />
      <p role="alert">このカードは見つかりません</p>
    </main>
  );
}

export default async function CardPage({ params }: PageProps<"/cards/[id]">) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return <NotFound />;
  }

  // 未登録のプレイヤーは core の card が PlayerNotRegisteredError を返すため、先に登録を済ませる
  const player = await currentPlayer();
  const result = player.ok ? await callCore(cardQuery, { id }) : player;
  if (!result.ok) {
    return (
      <main>
        <h1>カード</h1>
        <Navigation />
        <p role="alert">
          core に接続できません。時間をおいて再読み込みしてください。{" "}
          <Link href={`/cards/${id}`}>再読み込み</Link>
        </p>
      </main>
    );
  }
  const card = result.data.card;
  switch (card.__typename) {
    case "PlayerNotRegisteredError":
      // 登録の直後に未登録のままなのは、core の不具合（想定外）
      throw new Error("player is not registered after registerPlayer");
    case "CardNotFoundError":
      return <NotFound />;
  }

  return (
    <main>
      <h1>{card.name}</h1>
      <Navigation />
      <dl>
        <dt>種類</dt>
        <dd>{CARD_TYPE_LABELS[card.__typename]}</dd>
        <dt>コスト</dt>
        <dd>{card.cost}</dd>
        <dt>希少度</dt>
        <dd>{RARITY_LABELS[card.rarity]}</dd>
        {card.__typename === "CreatureCardInfo" && (
          <>
            <dt>属性</dt>
            <dd>{elementsLabel(card.elements)}</dd>
            <dt>AT</dt>
            <dd>{card.attack}</dd>
            <dt>HP</dt>
            <dd>{card.hitPoints}</dd>
            <dt>移動</dt>
            <dd>{card.movement}</dd>
          </>
        )}
        {card.__typename === "ItemCardInfo" && (
          <>
            <dt>分類</dt>
            <dd>{ITEM_CATEGORY_LABELS[card.category]}</dd>
            <dt>増減</dt>
            <dd>{itemBonusesLabel(card.attackBonus, card.hitPointsBonus)}</dd>
          </>
        )}
        {card.__typename === "SpellCardInfo" && (
          <>
            <dt>効果</dt>
            <dd>{spellEffectLabel(card.effect)}</dd>
          </>
        )}
      </dl>
    </main>
  );
}
