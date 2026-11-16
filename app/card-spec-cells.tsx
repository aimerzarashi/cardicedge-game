import type {
  BoardTileElement,
  CreatureElement,
  EffectDestruction,
  EffectKind,
  ItemCategory,
} from "@/graphql/graphql";
import {
  creatureSpecSummary,
  effectView,
  elementsLabel,
  itemSpecSummary,
  type SpellEffectView,
  spellEffectLabel,
} from "./messages";

type Effect = {
  kind: EffectKind;
  value?: number;
  minimum?: number;
  maximum?: number;
  percent?: number;
  constraints?: readonly { elements?: CreatureElement[] }[];
  destructions?: readonly EffectDestruction[];
  amount?: number;
};

type CardSpec =
  | {
      __typename: "CreatureCardInfo";
      elements: readonly CreatureElement[];
      attack: number;
      hitPoints: number;
      itemRestrictions: readonly ItemCategory[];
      placementRestrictions: readonly BoardTileElement[];
      effects: readonly Effect[];
    }
  | {
      __typename: "ItemCardInfo";
      category: ItemCategory;
      effects: readonly Effect[];
    }
  | { __typename: "SpellCardInfo"; effect: SpellEffectView };

// カードを並べる一覧（デッキ・NPC のデッキ・所持カード）の、属性・AT・HP・性能の 4 列。属性・AT・HP はクリーチャーだけで、
// ほかは「—」（game#56。studio のカードの一覧と同じ列）
export function CardSpecCells({ card }: { card: CardSpec }) {
  switch (card.__typename) {
    case "CreatureCardInfo":
      return (
        <>
          <td>{elementsLabel(card.elements)}</td>
          <td>{card.attack}</td>
          <td>{card.hitPoints}</td>
          <td>
            {creatureSpecSummary({
              ...card,
              effects: card.effects.map(effectView),
            })}
          </td>
        </>
      );
    case "ItemCardInfo":
      return (
        <>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td>
            {itemSpecSummary({
              ...card,
              effects: card.effects.map(effectView),
            })}
          </td>
        </>
      );
    case "SpellCardInfo":
      return (
        <>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td>{spellEffectLabel(card.effect)}</td>
        </>
      );
  }
}

export const CARD_SPEC_HEADERS = ["属性", "AT", "HP", "性能"] as const;
