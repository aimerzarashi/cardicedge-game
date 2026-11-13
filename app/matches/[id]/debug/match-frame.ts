import type {
  BoardTileElement,
  CardRarity,
  CreatureAbilityKind,
  CreatureElement,
  ItemCategory,
  MatchEndReason,
  MatchParticipantKind,
  MatchPhase,
} from "@/graphql/graphql";
import type { SpellEffectView } from "../../../messages.ts";

type Position = { x: number; y: number };

export type FrameCard = {
  __typename: string;
  id: string;
  name: string;
  cost: number;
  rarity: CardRarity;
  elements?: CreatureElement[];
  attack?: number;
  hitPoints?: number;
  itemRestrictions?: ItemCategory[];
  placementRestrictions?: CreatureElement[];
  abilities?: {
    kind: CreatureAbilityKind;
    percent?: number;
    attackModifier?: number;
    hitPointsModifier?: number;
    minimum?: number;
    maximum?: number;
  }[];
  category?: ItemCategory;
  attackModifier?: number;
  hitPointsModifier?: number;
  // スペルの効果（効果なしは null）
  effect?: { __typename: string; count?: number } | null;
};

export type FrameParticipant = {
  kind: MatchParticipantKind;
  avatar: { name: string };
  position: Position;
  magic: number;
  totalMagic: number;
  hand: FrameCard[];
  drawPileCount: number;
  // 捨て札（入った順）。山札が空のまま引くときに混ぜて山札になる
  discardPile: FrameDiscardedCard[];
  // 続いているスペルの効果（無ければ null）
  lastingSpellEffect: FrameLastingSpellEffect | null;
  turnOrder: number;
  passedCheckpoints: Position[];
  rewardReceived: boolean;
  rewardCards: { name: string }[];
};

export type FrameDiscardedCard = { id: string; name: string };

export type FrameLastingSpellEffect = {
  effect: SpellEffectView;
  remainingTurns: number;
};

export type FrameTerritory = {
  position: Position;
  owner: number;
  level: number;
  value: number;
  toll: number;
  creature: {
    id: number;
    hitPoints: number;
    card: { id: string; name: string; attack: number };
  };
};

// 戦闘が終わるまでの、侵略しているクリーチャー。領地には倒してから入る
export type FrameInvasion = {
  position: Position;
  card: FrameCard;
  hitPoints: number;
  // 移動で侵略したときだけ持つ。元の領地の位置（動いたクリーチャーは戦闘の間もそこにいる）
  from?: Position;
};

export type FrameBattleStats = { attack: number; hitPoints: number };

// 戦闘が始まってから終わるまでの両方の AT・HP。効果と攻撃の結果を core の値のまま持つ
export type FrameBattle = {
  attacker: FrameBattleStats;
  defender: FrameBattleStats;
};

// 画面に映すものすべて。表示はこのフレームだけから作る
export type MatchFrame = {
  revision: number;
  round: number;
  // 操作を待っていない間（始まる前・移動の途中）は null
  phase: MatchPhase | null;
  dice: number | null;
  // 複数のサイコロを同時に振ったときの 1 個ずつの目（1 個のとき・振る前・開いた時点は空）
  diceFaces: number[];
  remainingSteps: number;
  currentParticipant: number | null;
  participants: FrameParticipant[];
  territories: FrameTerritory[];
  invasion: FrameInvasion | null;
  battle: FrameBattle | null;
  // レベルを上げた土地（空き地を含む。無い土地はレベル 1。レベルは土地のもので、クリーチャーがいなくなっても残る。core#146）
  landLevels: { position: Position; level: number }[];
  // 開いた後に属性が変わった土地（盤面のマスの属性より優先する）
  landElements: { position: Position; element: BoardTileElement }[];
  outcome: {
    winners: number[];
    ranks: number[];
    reason: MatchEndReason;
  } | null;
};

// このイベントで変わった、core の決まりで決まる値。計算せずに当てる。段階のほかは変わった分だけ届く
export type MatchEventChanges = {
  phase?: MatchPhase | null;
  totalMagics: { participant: number; totalMagic: number }[];
  territoryValues: {
    position: Position;
    value: number;
    toll: number;
    level: number;
    chainCount: number;
    previousChainCount?: number | null;
  }[];
};

// core の MatchEvent の種類ごとの型を、再生に要る項目だけの形で受ける（__typename で見分ける）
export type PlayEvent = {
  __typename: string;
  revision: number;
  changes: MatchEventChanges;
  participant?: number;
  owner?: number;
  to?: Position;
  value?: number;
  card?: FrameCard;
  handIndex?: number;
  creature?: number;
  checkpoint?: Position;
  magic?: number;
  cost?: number;
  position?: Position;
  cards?: number;
  order?: number[];
  winners?: number[];
  ranks?: number[];
  reason?: MatchEndReason;
  pack?: string;
  rewardCards?: { name: string }[];
  striker?: "ATTACKER" | "DEFENDER";
  remainingHitPoints?: number;
  returnedToHand?: boolean;
  territoryHitPoints?: number;
  level?: number;
  returnedCard?: FrameCard;
  from?: Position;
  returnedTo?: Position | null;
  returnedHitPoints?: number | null;
  element?: BoardTileElement;
  attacker?: FrameBattleStats;
  defender?: FrameBattleStats;
  side?: "ATTACKER" | "DEFENDER";
  attack?: number;
  hitPoints?: number;
  drawPileCount?: number;
  dice?: number[];
  target?: number;
  effect?: { remainingTurns: number; effect?: SpellEffectView };
};

// 1 歩の演出にかける時間。演出を足すときは、種類ごとにここを変える
const DEFAULT_DURATION_MS = 300;
const NO_DRAWING_EVENTS = new Set([
  "MatchCreatedEvent",
  "MatchDecksShuffledEvent",
  "MatchRewardsCompletedEvent",
]);

export function eventDurationMs(event: PlayEvent): number {
  return NO_DRAWING_EVENTS.has(event.__typename) ? 0 : DEFAULT_DURATION_MS;
}

function samePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

function updateParticipant(
  frame: MatchFrame,
  seat: number,
  update: (participant: FrameParticipant) => FrameParticipant,
): MatchFrame {
  return {
    ...frame,
    participants: frame.participants.map((participant, index) =>
      index === seat ? update(participant) : participant,
    ),
  };
}

function landLevelAt(frame: MatchFrame, position: Position): number {
  return (
    frame.landLevels.find((land) => samePosition(land.position, position))
      ?.level ?? 1
  );
}

function withoutCard(hand: FrameCard[], handIndex: number): FrameCard[] {
  return hand.filter((_, index) => index !== handIndex);
}

function discarded(
  frame: MatchFrame,
  seat: number,
  card: FrameDiscardedCard | undefined,
): MatchFrame {
  if (!card) return frame;
  return updateParticipant(frame, seat, (participant) => ({
    ...participant,
    discardPile: [...participant.discardPile, { id: card.id, name: card.name }],
  }));
}

function territoryAt(
  frame: MatchFrame,
  position: Position | undefined,
): FrameTerritory | undefined {
  if (!position) return undefined;
  return frame.territories.find((territory) =>
    samePosition(territory.position, position),
  );
}

// 順番は core が turnOrder で返した値の小さい順。一周したら次のラウンド
// 終えた人に続いているスペルの効果は、残りのターンが 1 減る（最後のターンは、先に効果が終わったイベントで消えている）
function afterTurnEnded(frame: MatchFrame, seat: number): MatchFrame {
  const passed = updateParticipant(frame, seat, (participant) => ({
    ...participant,
    lastingSpellEffect: participant.lastingSpellEffect
      ? {
          ...participant.lastingSpellEffect,
          remainingTurns: participant.lastingSpellEffect.remainingTurns - 1,
        }
      : null,
  }));
  return nextTurn(passed, seat);
}

function nextTurn(frame: MatchFrame, seat: number): MatchFrame {
  const order = frame.participants
    .map((participant, index) => ({ index, turn: participant.turnOrder }))
    .sort((a, b) => a.turn - b.turn)
    .map(({ index }) => index);
  const next = order.indexOf(seat) + 1;
  const wraps = next >= order.length;
  return {
    ...frame,
    currentParticipant: order[wraps ? 0 : next],
    round: frame.round + (wraps ? 1 : 0),
    dice: null,
    diceFaces: [],
    remainingSteps: 0,
  };
}

// 奪った後の盤面。移動で侵略したクリーチャーは同じ 1 体のまま移り、元の土地は空き地になる
function conquered(
  frame: MatchFrame,
  event: PlayEvent,
  seat: number,
  position: Position | undefined,
  creature: number | undefined,
): MatchFrame {
  const { invasion } = frame;
  if (!invasion || !position || creature === undefined) return frame;
  if (invasion.from) {
    const origin = invasion.from;
    const mover = frame.territories.find((territory) =>
      samePosition(territory.position, origin),
    );
    return {
      ...frame,
      invasion: null,
      battle: null,
      territories: frame.territories
        .filter((territory) => !samePosition(territory.position, origin))
        .map((territory) =>
          samePosition(territory.position, position) && mover
            ? {
                ...territory,
                owner: seat,
                creature: {
                  ...mover.creature,
                  hitPoints: event.territoryHitPoints ?? 0,
                },
              }
            : territory,
        ),
    };
  }
  return {
    ...frame,
    invasion: null,
    battle: null,
    territories: frame.territories.map((territory) =>
      samePosition(territory.position, position)
        ? {
            ...territory,
            owner: seat,
            creature: {
              id: creature,
              hitPoints: event.territoryHitPoints ?? 0,
              card: {
                id: invasion.card.id,
                name: invasion.card.name,
                attack: invasion.card.attack ?? 0,
              },
            },
          }
        : territory,
    ),
  };
}

// イベントが述べた事実だけを当てる。決まりは持たない
function applyFact(
  frame: MatchFrame,
  event: PlayEvent,
  base: Position,
): MatchFrame {
  const seat = event.participant ?? 0;
  const magic = event.magic ?? 0;
  switch (event.__typename) {
    case "MatchCardDrawnEvent": {
      const card = event.card;
      if (!card) return frame;
      return updateParticipant(frame, seat, (participant) => ({
        ...participant,
        hand: [...participant.hand, card],
        drawPileCount: participant.drawPileCount - 1,
      }));
    }
    case "MatchCardDiscardedEvent":
      return discarded(
        updateParticipant(frame, seat, (participant) => ({
          ...participant,
          hand: withoutCard(participant.hand, event.handIndex ?? 0),
        })),
        seat,
        event.card,
      );
    case "MatchDiscardPileShuffledEvent":
      return updateParticipant(frame, seat, (participant) => ({
        ...participant,
        discardPile: [],
        drawPileCount: event.drawPileCount ?? 0,
      }));
    case "MatchDiceRolledEvent":
      return {
        ...frame,
        dice: event.value ?? 0,
        diceFaces: event.dice ?? [],
        remainingSteps: event.value ?? 0,
      };
    case "MatchMovedEvent": {
      const to = event.to;
      if (!to) return frame;
      return {
        ...updateParticipant(frame, seat, (participant) => ({
          ...participant,
          position: to,
        })),
        remainingSteps: frame.remainingSteps - 1,
      };
    }
    case "MatchCheckpointPassedEvent": {
      const checkpoint = event.checkpoint;
      if (!checkpoint) return frame;
      return updateParticipant(frame, seat, (participant) => ({
        ...participant,
        magic: participant.magic + magic,
        passedCheckpoints: [...participant.passedCheckpoints, checkpoint],
      }));
    }
    case "MatchLapCompletedEvent":
      return updateParticipant(frame, seat, (participant) => ({
        ...participant,
        magic: participant.magic + magic,
        passedCheckpoints: [],
      }));
    case "MatchCreaturePlacedEvent": {
      const { card, position, creature } = event;
      if (!card || !position || creature === undefined) return frame;
      const paid = updateParticipant(frame, seat, (participant) => ({
        ...participant,
        hand: withoutCard(participant.hand, event.handIndex ?? 0),
        magic: participant.magic - (event.cost ?? 0),
      }));
      return {
        ...paid,
        territories: [
          ...paid.territories,
          {
            position,
            owner: seat,
            // 空き地に残っていたレベルを引き継ぐ
            level: landLevelAt(paid, position),
            // 価値と通行料は続けて当てる changes の値で決まる
            value: 0,
            toll: 0,
            creature: {
              id: creature,
              hitPoints: card.hitPoints ?? 0,
              card: { id: card.id, name: card.name, attack: card.attack ?? 0 },
            },
          },
        ],
      };
    }
    case "MatchTerritoryInvadedEvent": {
      const { card, position } = event;
      if (!card || !position) return frame;
      return {
        ...updateParticipant(frame, seat, (participant) => ({
          ...participant,
          hand: withoutCard(participant.hand, event.handIndex ?? 0),
          magic: participant.magic - (event.cost ?? 0),
        })),
        invasion: { position, card, hitPoints: card.hitPoints ?? 0 },
      };
    }
    case "MatchSpellEffectStartedEvent": {
      const { effect, target } = event;
      if (!effect || target === undefined) return frame;
      return updateParticipant(frame, target, (participant) => ({
        ...participant,
        lastingSpellEffect: {
          effect: effect.effect,
          remainingTurns: effect.remainingTurns,
        },
      }));
    }
    case "MatchCreatureDamagedEvent": {
      const { position, remainingHitPoints } = event;
      if (!position || remainingHitPoints === undefined) return frame;
      return {
        ...frame,
        territories: frame.territories.map((territory) =>
          samePosition(territory.position, position)
            ? {
                ...territory,
                creature: {
                  ...territory.creature,
                  hitPoints: remainingHitPoints,
                },
              }
            : territory,
        ),
      };
    }
    case "MatchCreatureDestroyedEvent": {
      // 破壊されたクリーチャーは持ち主の捨て札に入り、土地は空く（レベルは土地に残る）
      const destroyed = territoryAt(frame, event.position);
      if (!destroyed) return frame;
      const discardedFrame = discarded(
        frame,
        destroyed.owner,
        destroyed.creature.card,
      );
      return {
        ...discardedFrame,
        territories: discardedFrame.territories.filter(
          (territory) => !samePosition(territory.position, destroyed.position),
        ),
      };
    }
    case "MatchSpellEffectEndedEvent":
      return updateParticipant(frame, seat, (participant) => ({
        ...participant,
        lastingSpellEffect: null,
      }));
    case "MatchMagicGainedEvent":
      return updateParticipant(frame, seat, (participant) => ({
        ...participant,
        magic: participant.magic + magic,
      }));
    case "MatchSpellUsedEvent":
      // 使ったスペルは捨て札に入る。効果は続くイベント（引いたカード等）で当たる
      return discarded(
        updateParticipant(frame, seat, (participant) => ({
          ...participant,
          hand: withoutCard(participant.hand, event.handIndex ?? 0),
          magic: participant.magic - (event.cost ?? 0),
        })),
        seat,
        event.card,
      );
    case "MatchItemUsedEvent":
      return discarded(
        updateParticipant(frame, seat, (participant) => ({
          ...participant,
          hand: withoutCard(participant.hand, event.handIndex ?? 0),
          magic: participant.magic - (event.cost ?? 0),
        })),
        seat,
        event.card,
      );
    case "MatchBattleStartedEvent": {
      const { attacker, defender } = event;
      if (!attacker || !defender) return frame;
      return { ...frame, battle: { attacker, defender } };
    }
    case "MatchBattleStatModifiedEvent": {
      const { battle } = frame;
      const { attack, hitPoints, side } = event;
      if (!battle || attack === undefined || hitPoints === undefined) {
        return frame;
      }
      return {
        ...frame,
        battle:
          side === "DEFENDER"
            ? { ...battle, defender: { attack, hitPoints } }
            : { ...battle, attacker: { attack, hitPoints } },
      };
    }
    case "MatchCreatureStruckEvent": {
      const battle = frame.battle;
      if (!battle) return frame;
      const hitPoints = event.remainingHitPoints ?? 0;
      return {
        ...frame,
        battle:
          event.striker === "DEFENDER"
            ? { ...battle, attacker: { ...battle.attacker, hitPoints } }
            : { ...battle, defender: { ...battle.defender, hitPoints } },
      };
    }
    case "MatchTerritoryConqueredEvent": {
      const { position, creature } = event;
      const defeated = territoryAt(frame, position);
      // 倒されたクリーチャーは持ち主の捨て札に入る
      const frameWithDefeated = defeated
        ? discarded(frame, defeated.owner, defeated.creature.card)
        : frame;
      return conquered(frameWithDefeated, event, seat, position, creature);
    }
    case "MatchInvasionRepelledEvent": {
      const { card, position } = event;
      const cleared = {
        ...frame,
        invasion: null,
        battle: null,
        territories: frame.territories.map((territory) =>
          position && samePosition(territory.position, position)
            ? {
                ...territory,
                creature: {
                  ...territory.creature,
                  hitPoints: event.territoryHitPoints ?? 0,
                },
              }
            : territory,
        ),
      };
      const origin = frame.invasion?.from;
      if (origin) {
        // 移動で侵略したときは、生き残れば元の領地に戻り（傷は残る）、倒れれば元の土地が空き地になり、捨て札に入る
        const { returnedTo, returnedHitPoints } = event;
        if (!returnedTo) {
          const destroyed = discarded(
            cleared,
            seat,
            territoryAt(frame, origin)?.creature.card,
          );
          return {
            ...destroyed,
            territories: destroyed.territories.filter(
              (territory) => !samePosition(territory.position, origin),
            ),
          };
        }
        return {
          ...cleared,
          territories: cleared.territories.map((territory) =>
            samePosition(territory.position, origin)
              ? {
                  ...territory,
                  creature: {
                    ...territory.creature,
                    hitPoints: returnedHitPoints ?? 0,
                  },
                }
              : territory,
          ),
        };
      }
      if (!card) return cleared;
      if (!event.returnedToHand) return discarded(cleared, seat, card);
      return updateParticipant(cleared, seat, (participant) => ({
        ...participant,
        hand: [...participant.hand, card],
      }));
    }
    case "MatchTollPaidEvent": {
      const paid = updateParticipant(frame, seat, (participant) => ({
        ...participant,
        magic: participant.magic - magic,
      }));
      return updateParticipant(paid, event.owner ?? 0, (participant) => ({
        ...participant,
        magic: participant.magic + magic,
      }));
    }
    case "MatchTerritoryLeveledUpEvent": {
      const { position, level } = event;
      if (!position || level === undefined) return frame;
      const paid = updateParticipant(frame, seat, (participant) => ({
        ...participant,
        magic: participant.magic - magic,
      }));
      return {
        ...paid,
        landLevels: [
          ...paid.landLevels.filter(
            (land) => !samePosition(land.position, position),
          ),
          { position, level },
        ],
        territories: paid.territories.map((territory) =>
          samePosition(territory.position, position)
            ? { ...territory, level }
            : territory,
        ),
      };
    }
    case "MatchCreatureMovedEvent": {
      const { from, to } = event;
      if (!from || !to) return frame;
      return {
        ...frame,
        territories: frame.territories.map((territory) =>
          samePosition(territory.position, from)
            ? { ...territory, position: to, level: landLevelAt(frame, to) }
            : territory,
        ),
      };
    }
    case "MatchTerritoryInvadedByMoveEvent": {
      const { from, position } = event;
      const origin = from
        ? frame.territories.find((territory) =>
            samePosition(territory.position, from),
          )
        : undefined;
      if (!from || !position || !origin) return frame;
      const card: FrameCard = {
        __typename: "CreatureCardInfo",
        id: origin.creature.card.id,
        name: origin.creature.card.name,
        cost: 0,
        rarity: "NORMAL" as FrameCard["rarity"],
        attack: origin.creature.card.attack,
        hitPoints: origin.creature.hitPoints,
      };
      return {
        ...frame,
        invasion: {
          position,
          card,
          hitPoints: origin.creature.hitPoints,
          from,
        },
      };
    }
    case "MatchLandElementChangedEvent": {
      const { position, element } = event;
      if (!position || !element) return frame;
      return {
        ...updateParticipant(frame, seat, (participant) => ({
          ...participant,
          magic: participant.magic - magic,
        })),
        landElements: [
          ...frame.landElements.filter(
            (changed) => !samePosition(changed.position, position),
          ),
          { position, element },
        ],
      };
    }
    case "MatchCreatureExchangedEvent": {
      const { card, position, creature, returnedCard } = event;
      if (!card || !position || creature === undefined || !returnedCard) {
        return frame;
      }
      const paid = updateParticipant(frame, seat, (participant) => ({
        ...participant,
        hand: [
          ...withoutCard(participant.hand, event.handIndex ?? 0),
          returnedCard,
        ],
        magic: participant.magic - (event.cost ?? 0),
      }));
      return {
        ...paid,
        territories: paid.territories.map((territory) =>
          samePosition(territory.position, position)
            ? {
                ...territory,
                creature: {
                  id: creature,
                  hitPoints: card.hitPoints ?? 0,
                  card: {
                    id: card.id,
                    name: card.name,
                    attack: card.attack ?? 0,
                  },
                },
              }
            : territory,
        ),
      };
    }
    case "MatchTerritoryRelinquishedEvent": {
      const position = event.position;
      if (!position) return frame;
      // 手放した領地のクリーチャーは捨て札に入る
      const received = discarded(
        updateParticipant(frame, seat, (participant) => ({
          ...participant,
          magic: participant.magic + magic,
        })),
        seat,
        territoryAt(frame, position)?.creature.card,
      );
      return {
        ...received,
        territories: received.territories.filter(
          (territory) => !samePosition(territory.position, position),
        ),
      };
    }
    case "MatchMagicDepletedEvent":
      return updateParticipant(frame, seat, (participant) => ({
        ...participant,
        magic,
        position: base,
        passedCheckpoints: [],
      }));
    case "MatchTurnEndedEvent":
      return afterTurnEnded(frame, seat);
    case "MatchEndedEvent": {
      const { winners, ranks, reason } = event;
      if (!winners || !ranks || !reason) return frame;
      return { ...frame, outcome: { winners, ranks, reason } };
    }
    case "MatchRewardDrawnEvent":
      return updateParticipant(frame, seat, (participant) => ({
        ...participant,
        rewardReceived: true,
        rewardCards: event.rewardCards ?? [],
      }));
    default:
      return frame;
  }
}

function withChanges(
  frame: MatchFrame,
  changes: MatchEventChanges,
): MatchFrame {
  return {
    ...frame,
    phase: changes.phase ?? null,
    participants: frame.participants.map((participant, seat) => {
      const found = changes.totalMagics.find(
        (candidate) => candidate.participant === seat,
      );
      return found
        ? { ...participant, totalMagic: found.totalMagic }
        : participant;
    }),
    territories: frame.territories.map((territory) => {
      const found = changes.territoryValues.find((candidate) =>
        samePosition(candidate.position, territory.position),
      );
      return found
        ? { ...territory, value: found.value, toll: found.toll }
        : territory;
    }),
  };
}

// 前のフレーム + イベント → 次のフレーム。base は拠点の位置（魔力が枯渇すると戻る）
export function applyEvent(
  frame: MatchFrame,
  event: PlayEvent,
  base: Position,
): MatchFrame {
  return {
    ...withChanges(applyFact(frame, event, base), event.changes),
    revision: event.revision,
  };
}
