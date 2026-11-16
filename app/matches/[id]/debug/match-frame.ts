import type {
  BoardTileElement,
  CardRarity,
  CreatureElement,
  EffectKind,
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
  placementRestrictions?: BoardTileElement[];
  category?: ItemCategory;
  // クリーチャー・アイテムの効果（core の Effect の並び。core#178）
  effects?: FrameEffect[];
  // スペルの効果（効果なしは null）
  effect?: { __typename: string; count?: number } | null;
};

export type FrameEffect = {
  kind: EffectKind;
  value?: number;
  minimum?: number;
  maximum?: number;
  percent?: number;
  constraints?: { elements?: CreatureElement[] }[];
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
  // 両方が選んだアイテムの名前。選ぶ前は undefined、出さなかったら null
  attackerItem?: string | null;
  defenderItem?: string | null;
  // 直前に選んだ側（その間だけ画面で色を変える）
  chosenBy?: "ATTACKER" | "DEFENDER" | null;
};

export type FrameBattleStats = { attack: number; hitPoints: number };

// 戦闘の中で AT・HP を変えた発動 1 つ。出どころは支援効果・地形効果・アイテム（名前と効果の種類）・クリーチャーの効果（種類）
export type FrameBattleModifier = {
  source:
    | { kind: "support" }
    | { kind: "terrain" }
    | { kind: "item"; name: string; effect: EffectKind }
    | { kind: "creature"; effect: EffectKind };
  attackDelta: number;
  hitPointsDelta: number;
};

// 戦闘の中の片方。core の戦闘の中の値の層（戦闘の前・効果ごとの増減・得た状態・受けたダメージ）と同じ形で持ち、
// 今の AT・HP は core の値のまま持つ（計算しない。描画がイベントの過不足に気づく場になるように。game#98）
export type FrameBattleSide = {
  name: string;
  // 出したアイテムの名前（出さなかったら null、戦闘が始まる前でまだ選んでいなければ undefined）
  item: string | null | undefined;
  initial: FrameBattleStats;
  modifiers: FrameBattleModifier[];
  // 発動で得た状態（先制・後手・攻撃無効。効果の種類で持つ）
  states: EffectKind[];
  // 攻撃で受けたダメージ（受けた順）
  damages: number[];
  // 相手の効果「地形効果を無視する」で、地形効果の分を数えなくなったか（core の BattleCreature.TerrainEffectIgnored。core#177）
  terrainIgnored: boolean;
  current: FrameBattleStats;
};

// 直前のイベントで変わった所（その間だけ画面で色を変え、何が起きたかを追いやすくする。2026-11-14 オーナー。game#98）
export type FrameBattleHighlight =
  | {
      side: "ATTACKER" | "DEFENDER";
      part: "modifier" | "damage" | "state";
      index: number;
    }
  | { side: "ATTACKER" | "DEFENDER"; part: "terrainIgnored" }
  | { side: "ATTACKER" | "DEFENDER"; part: "item" }
  | { part: "result" };

// 戦闘が始まってから、次の侵略が始まるまで（結果を確かめられるよう、奪う・退けた後も、ターンが終わった後も残す。
// 再生は 1 歩が短く、ターンの終わりで消すと開いたときには見えないため。2026-11-14 オーナー。game#98）
export type FrameBattle = {
  attacker: FrameBattleSide;
  defender: FrameBattleSide;
  // 先に攻撃した側（まだ攻撃が無ければ null）と、攻撃の回数
  firstStriker: "ATTACKER" | "DEFENDER" | null;
  strikes: number;
  result: "conquered" | "repelled" | null;
  highlight: FrameBattleHighlight | null;
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
  // クリーチャー・アイテムの効果の発動で、発動したカードの効果
  activatedEffect?: FrameEffect;
  // 地形効果を無視するの、相手の増減と当てた後の値
  opponentChange?: {
    attackDelta: number;
    hitPointsDelta: number;
    attack: number;
    hitPoints: number;
  } | null;
  damage?: number;
  change?: {
    attackDelta: number;
    hitPointsDelta: number;
    attack: number;
    hitPoints: number;
  } | null;
  drawPileCount?: number;
  dice?: number[];
  target?: number;
  effect?: { remainingTurns: number; effect?: SpellEffectView };
};

// 1 歩の演出にかける時間。演出を足すときは、種類ごとにここを変える
const DEFAULT_DURATION_MS = 300;
const NO_DRAWING_EVENTS = new Set([
  "MatchCreatedEvent",
  "MatchDrawPilesShuffledEvent",
  "MatchAllRewardsReceivedEvent",
]);

// 戦闘の出来事は、効果の積み上げと攻撃を目で追えるよう長く見せる（2026-11-14 オーナー。game#98）
const BATTLE_DURATION_MS = 1200;
const BATTLE_EVENTS = new Set([
  "MatchBattleStartedEvent",
  "MatchBattleSupportEffectActivatedEvent",
  "MatchBattleTerrainEffectActivatedEvent",
  "MatchBattleCreatureEffectActivatedEvent",
  "MatchBattleItemEffectActivatedEvent",
  "MatchCreatureStruckEvent",
  "MatchInvadingCreatureDestroyedEvent",
  "MatchDefendingCreatureDestroyedEvent",
  "MatchInvasionSucceededEvent",
  "MatchInvasionFailedEvent",
]);

export function eventDurationMs(event: PlayEvent): number {
  if (NO_DRAWING_EVENTS.has(event.__typename)) return 0;
  return BATTLE_EVENTS.has(event.__typename)
    ? BATTLE_DURATION_MS
    : DEFAULT_DURATION_MS;
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

function withResult(
  battle: FrameBattle | null,
  result: "conquered" | "repelled",
): FrameBattle | null {
  return battle ? { ...battle, result, highlight: { part: "result" } } : null;
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

// 奪った後の盤面。守るクリーチャーは直前の破壊で領地から外れているので、空いた土地に領地を足す（core#181）。
// 移動で侵略したクリーチャーは同じ 1 体のまま移り、元の土地は空き地になる
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
    if (!mover) return frame;
    return {
      ...frame,
      invasion: null,
      battle: withResult(frame.battle, "conquered"),
      territories: [
        ...frame.territories.filter(
          (territory) => !samePosition(territory.position, origin),
        ),
        newTerritory(frame, position, seat, {
          ...mover.creature,
          hitPoints: event.territoryHitPoints ?? 0,
        }),
      ],
    };
  }
  return {
    ...frame,
    invasion: null,
    battle: withResult(frame.battle, "conquered"),
    territories: [
      ...frame.territories,
      newTerritory(frame, position, seat, {
        id: creature,
        hitPoints: event.territoryHitPoints ?? 0,
        card: {
          id: invasion.card.id,
          name: invasion.card.name,
          attack: invasion.card.attack ?? 0,
        },
      }),
    ],
  };
}

// 空き地に入った領地。レベルは土地に残っていたものを引き継ぎ、価値と通行料は続けて当てる changes の値で決まる
function newTerritory(
  frame: MatchFrame,
  position: Position,
  owner: number,
  creature: FrameTerritory["creature"],
): FrameTerritory {
  return {
    position,
    owner,
    level: landLevelAt(frame, position),
    value: 0,
    toll: 0,
    creature,
  };
}

// 領地のクリーチャーが破壊された後の盤面。持ち主の捨て札に入り、土地は空く（レベルは土地に残る）
function territoryCreatureDestroyed(
  frame: MatchFrame,
  position: Position | undefined,
): MatchFrame {
  const destroyed = territoryAt(frame, position);
  if (!destroyed) return frame;
  const discardedFrame = discarded(
    frame,
    destroyed.owner,
    destroyed.creature.card,
  );
  return {
    ...discardedFrame,
    // レベルは土地に残るので、次に入るクリーチャーが引き継げるよう landLevels に残す
    landLevels: [
      ...discardedFrame.landLevels.filter(
        (land) => !samePosition(land.position, destroyed.position),
      ),
      { position: destroyed.position, level: destroyed.level },
    ],
    territories: discardedFrame.territories.filter(
      (territory) => !samePosition(territory.position, destroyed.position),
    ),
  };
}

// 侵略の番の人（攻める側）か、領地の持ち主（守る側）が選んだアイテムを、侵略の欄に残す
function withChosenItem(
  frame: MatchFrame,
  seat: number,
  item: string | null,
): MatchFrame {
  const { invasion } = frame;
  if (!invasion) return frame;
  return {
    ...frame,
    invasion:
      seat === frame.currentParticipant
        ? { ...invasion, attackerItem: item, chosenBy: "ATTACKER" }
        : { ...invasion, defenderItem: item, chosenBy: "DEFENDER" },
  };
}

function updateBattleSide(
  frame: MatchFrame,
  side: "ATTACKER" | "DEFENDER",
  update: (side: FrameBattleSide) => FrameBattleSide,
): MatchFrame {
  const { battle } = frame;
  if (!battle) return frame;
  return {
    ...frame,
    battle:
      side === "DEFENDER"
        ? { ...battle, defender: update(battle.defender) }
        : { ...battle, attacker: update(battle.attacker) },
  };
}

// 発動で得た増減を足し、今の AT・HP を core の当てた後の値に置き換える
function withBattleModifier(
  frame: MatchFrame,
  side: "ATTACKER" | "DEFENDER",
  source: FrameBattleModifier["source"],
  event: PlayEvent,
): MatchFrame {
  const { change } = event;
  if (!change) return frame;
  const index = frame.battle
    ? (side === "DEFENDER" ? frame.battle.defender : frame.battle.attacker)
        .modifiers.length
    : 0;
  return withHighlight(
    updateBattleSide(frame, side, (current) => ({
      ...current,
      modifiers: [
        ...current.modifiers,
        {
          source,
          attackDelta: change.attackDelta,
          hitPointsDelta: change.hitPointsDelta,
        },
      ],
      current: { attack: change.attack, hitPoints: change.hitPoints },
    })),
    { side, part: "modifier", index },
  );
}

function withHighlight(
  frame: MatchFrame,
  highlight: FrameBattleHighlight,
): MatchFrame {
  return frame.battle
    ? { ...frame, battle: { ...frame.battle, highlight } }
    : frame;
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
    case "MatchPieceMovedEvent": {
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
        battle: null,
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
    case "MatchBoardCreatureDestroyedEvent":
      return territoryCreatureDestroyed(frame, event.position);
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
    case "MatchMagicReceivedEvent":
      // 破壊されたら魔力を得るの結果は、今の番の人でなく持ち主が受け取る（core#182）
      return updateParticipant(frame, event.owner ?? seat, (participant) => ({
        ...participant,
        magic: participant.magic + magic,
      }));
    case "MatchCardReturnedToHandEvent": {
      // 破壊で捨て札の最後に入ったそのカードを、持ち主の手札の最後へ移す
      const { card } = event;
      if (!card) return frame;
      return updateParticipant(frame, event.owner ?? seat, (participant) => ({
        ...participant,
        discardPile:
          participant.discardPile.at(-1)?.id === card.id
            ? participant.discardPile.slice(0, -1)
            : participant.discardPile,
        hand: [...participant.hand, card],
      }));
    }
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
      return withChosenItem(
        discarded(
          updateParticipant(frame, seat, (participant) => ({
            ...participant,
            hand: withoutCard(participant.hand, event.handIndex ?? 0),
            magic: participant.magic - (event.cost ?? 0),
          })),
          seat,
          event.card,
        ),
        seat,
        event.card?.name ?? null,
      );
    case "MatchItemSkippedEvent":
      return withChosenItem(frame, seat, null);
    case "MatchBattleStartedEvent": {
      const { attacker, defender } = event;
      const { invasion } = frame;
      if (!attacker || !defender || !invasion) return frame;
      const side = (
        name: string,
        item: string | null | undefined,
        initial: FrameBattleStats,
      ): FrameBattleSide => ({
        name,
        item: item ?? null,
        initial,
        modifiers: [],
        states: [],
        damages: [],
        terrainIgnored: false,
        current: initial,
      });
      return {
        ...frame,
        battle: {
          attacker: side(invasion.card.name, invasion.attackerItem, attacker),
          defender: side(
            territoryAt(frame, invasion.position)?.creature.card.name ?? "",
            invasion.defenderItem,
            defender,
          ),
          firstStriker: null,
          strikes: 0,
          result: null,
          highlight: null,
        },
      };
    }
    case "MatchBattleSupportEffectActivatedEvent":
      return withBattleModifier(
        frame,
        event.side ?? "ATTACKER",
        { kind: "support" },
        event,
      );
    case "MatchBattleTerrainEffectActivatedEvent":
      return withBattleModifier(frame, "DEFENDER", { kind: "terrain" }, event);
    case "MatchBattleItemEffectActivatedEvent": {
      const effect = event.activatedEffect;
      if (!effect) return frame;
      const owner = event.side ?? "ATTACKER";
      if (effect.kind === "IGNORE_TERRAIN_EFFECT") {
        // 無視されるのは相手の地形効果なので、相手の側を変える。今の値は core の値のまま
        const opponent = owner === "DEFENDER" ? "ATTACKER" : "DEFENDER";
        const { opponentChange } = event;
        return withHighlight(
          updateBattleSide(frame, opponent, (side) => ({
            ...side,
            terrainIgnored: true,
            current: opponentChange
              ? {
                  attack: opponentChange.attack,
                  hitPoints: opponentChange.hitPoints,
                }
              : side.current,
          })),
          { side: opponent, part: "terrainIgnored" },
        );
      }
      return withBattleModifier(
        frame,
        owner,
        { kind: "item", name: event.card?.name ?? "", effect: effect.kind },
        event,
      );
    }
    case "MatchBattleCreatureEffectActivatedEvent": {
      const effect = event.activatedEffect?.kind;
      if (!effect) return frame;
      if (event.change) {
        return withBattleModifier(
          frame,
          event.side ?? "ATTACKER",
          { kind: "creature", effect },
          event,
        );
      }
      const owner = event.side ?? "ATTACKER";
      const index = frame.battle
        ? (owner === "DEFENDER" ? frame.battle.defender : frame.battle.attacker)
            .states.length
        : 0;
      return withHighlight(
        updateBattleSide(frame, owner, (side) => ({
          ...side,
          states: [...side.states, effect],
        })),
        { side: owner, part: "state", index },
      );
    }
    case "MatchCreatureStruckEvent": {
      const { battle } = frame;
      if (!battle) return frame;
      const striker = event.striker ?? "ATTACKER";
      const receiver = striker === "DEFENDER" ? "ATTACKER" : "DEFENDER";
      const damageIndex = (
        receiver === "DEFENDER" ? battle.defender : battle.attacker
      ).damages.length;
      const struck = updateBattleSide(frame, receiver, (side) => ({
        ...side,
        damages: [...side.damages, event.damage ?? 0],
        current: {
          ...side.current,
          hitPoints: event.remainingHitPoints ?? 0,
        },
      }));
      if (!struck.battle) return struck;
      return {
        ...struck,
        battle: {
          ...struck.battle,
          firstStriker: battle.firstStriker ?? striker,
          strikes: battle.strikes + 1,
          highlight: { side: receiver, part: "damage", index: damageIndex },
        },
      };
    }
    case "MatchDefendingCreatureDestroyedEvent":
      return territoryCreatureDestroyed(frame, event.position);
    case "MatchInvadingCreatureDestroyedEvent": {
      // 侵略したクリーチャーは今の番の人の捨て札に入る。移動で侵略していたら元の土地が空く
      const origin = frame.invasion?.from;
      if (origin) return territoryCreatureDestroyed(frame, origin);
      return discarded(frame, seat, frame.invasion?.card);
    }
    case "MatchInvasionSucceededEvent":
      return conquered(frame, event, seat, event.position, event.creature);
    case "MatchInvasionFailedEvent": {
      const { card, position } = event;
      const cleared = {
        ...frame,
        invasion: null,
        battle: withResult(frame.battle, "repelled"),
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
        // 移動で侵略したときは、生き残れば元の領地に戻る（傷は残る）。倒れていれば直前の破壊で元の土地は空いている
        const { returnedTo, returnedHitPoints } = event;
        if (!returnedTo) return cleared;
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
      // 倒れていれば、直前の破壊で捨て札に入っている
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
    case "MatchLandLeveledUpEvent": {
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
        battle: null,
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
    ...withChanges(
      applyFact(withoutHighlight(frame), event, base),
      event.changes,
    ),
    revision: event.revision,
  };
}

// 色を変えるのは直前のイベントで変わった所だけなので、次のイベントを当てる前に消す
function withoutHighlight(frame: MatchFrame): MatchFrame {
  return {
    ...frame,
    battle: frame.battle ? { ...frame.battle, highlight: null } : null,
    invasion: frame.invasion ? { ...frame.invasion, chosenBy: null } : null,
  };
}

// 戦闘のシーン。攻める側のアイテム選択 → 守る側のアイテム選択 → 先攻 → 後攻 → 結果（2026-11-14 オーナー。game#98）。
// 先攻のシーンは、戦闘が始まって効果を当て、先に攻撃するまで
export type BattleScene =
  | "attackerItem"
  | "defenderItem"
  | "firstStrike"
  | "secondStrike"
  | "result";

export const BATTLE_SCENES: BattleScene[] = [
  "attackerItem",
  "defenderItem",
  "firstStrike",
  "secondStrike",
  "result",
];

// 今のシーン（侵略していなければ null）
// 戦闘の欄に出す両方の側。戦闘が始まる前（アイテムを選ぶ間）も、侵略したクリーチャーと領地のクリーチャーを出す
// （侵略した時点から誰と誰が戦うかを見せるため。2026-11-15 オーナー。game#99）。始まる前の値は、侵略したクリーチャーの
// カードの AT と今の HP、領地のクリーチャーのカードの AT と今の HP で、始まった後は core の値（MatchBattleStartedEvent）
export function battleOnView(frame: MatchFrame): FrameBattle | null {
  if (frame.battle) return frame.battle;
  const { invasion } = frame;
  if (!invasion) return null;
  const defending = territoryAt(frame, invasion.position);
  const side = (
    name: string,
    item: string | null | undefined,
    initial: FrameBattleStats,
  ): FrameBattleSide => ({
    name,
    item,
    initial,
    modifiers: [],
    states: [],
    damages: [],
    terrainIgnored: false,
    current: initial,
  });
  return {
    attacker: side(invasion.card.name, invasion.attackerItem, {
      attack: invasion.card.attack ?? 0,
      hitPoints: invasion.hitPoints,
    }),
    defender: side(defending?.creature.card.name ?? "", invasion.defenderItem, {
      attack: defending?.creature.card.attack ?? 0,
      hitPoints: defending?.creature.hitPoints ?? 0,
    }),
    firstStriker: null,
    strikes: 0,
    result: null,
    highlight: invasion.chosenBy
      ? { side: invasion.chosenBy, part: "item" }
      : null,
  };
}

export function battleScene(frame: MatchFrame): BattleScene | null {
  const { battle } = frame;
  if (battle) {
    if (battle.result) return "result";
    return battle.strikes === 0 ? "firstStrike" : "secondStrike";
  }
  if (!frame.invasion) return null;
  if (frame.phase === "ATTACKING") return "attackerItem";
  if (frame.phase === "DEFENDING") return "defenderItem";
  return null;
}
