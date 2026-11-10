import type {
  BoardTileElement,
  CardRarity,
  CreatureElement,
  ItemCategory,
  MatchEndReason,
  MatchParticipantKind,
  MatchPhase,
} from "@/graphql/graphql";

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
  category?: ItemCategory;
  attackBonus?: number;
  hitPointsBonus?: number;
};

export type FrameParticipant = {
  kind: MatchParticipantKind;
  avatar: { name: string };
  position: Position;
  magic: number;
  totalMagic: number;
  hand: FrameCard[];
  drawPileCount: number;
  turnOrder: number;
  passedCheckpoints: Position[];
  rewardReceived: boolean;
  rewardCards: { name: string }[];
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
  remainingSteps: number;
  currentParticipant: number | null;
  participants: FrameParticipant[];
  territories: FrameTerritory[];
  invasion: FrameInvasion | null;
  battle: FrameBattle | null;
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
  territoryValues: { position: Position; value: number; toll: number }[];
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
  element?: BoardTileElement;
  attacker?: FrameBattleStats;
  defender?: FrameBattleStats;
  side?: "ATTACKER" | "DEFENDER";
  attack?: number;
  hitPoints?: number;
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

function withoutCard(hand: FrameCard[], handIndex: number): FrameCard[] {
  return hand.filter((_, index) => index !== handIndex);
}

// 順番は core が turnOrder で返した値の小さい順。一周したら次のラウンド
function afterTurnEnded(frame: MatchFrame, seat: number): MatchFrame {
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
    remainingSteps: 0,
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
      return updateParticipant(frame, seat, (participant) => ({
        ...participant,
        hand: withoutCard(participant.hand, event.handIndex ?? 0),
      }));
    case "MatchDiceRolledEvent":
      return {
        ...frame,
        dice: event.value ?? 0,
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
    case "MatchCreatureDeployedEvent": {
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
            level: 1,
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
    case "MatchItemUsedEvent":
      return updateParticipant(frame, seat, (participant) => ({
        ...participant,
        hand: withoutCard(participant.hand, event.handIndex ?? 0),
        magic: participant.magic - (event.cost ?? 0),
      }));
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
      const { invasion } = frame;
      const { position, creature } = event;
      if (!invasion || !position || creature === undefined) return frame;
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
      if (!card || !event.returnedToHand) return cleared;
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
        territories: paid.territories.map((territory) =>
          samePosition(territory.position, position)
            ? { ...territory, level }
            : territory,
        ),
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
      const received = updateParticipant(frame, seat, (participant) => ({
        ...participant,
        magic: participant.magic + magic,
      }));
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
