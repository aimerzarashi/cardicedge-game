import type {
  BoardTileElement,
  CreatureAbilityKind,
  ItemEffectKind,
} from "@/graphql/graphql";
import { ELEMENT_LABELS } from "../boards/board-layout.ts";
import {
  battleModifierChangeLabel,
  CREATURE_ABILITY_LABELS,
  diceRolledLabel,
  ITEM_EFFECT_LABELS,
  itemModifiersLabel,
  MATCH_END_REASON_LABELS,
  MATCH_EVENT_MESSAGES,
  type SpellEffectView,
  spellEffectStartedLabel,
} from "../messages.ts";

// core の MatchEvent の種類ごとの型を、画面が使う項目だけの形で受ける（__typename で見分ける）
export type MatchEventView = {
  __typename: string;
  revision: number;
  participant?: number;
  to?: { x: number; y: number };
  value?: number;
  card?: { name: string };
  defendingCreatureCard?: { name: string };
  handCount?: number;
  maxHandCards?: number;
  laps?: number;
  magicPerLap?: number;
  baseLandValue?: number;
  multiplier?: number;
  checkpoint?: { x: number; y: number };
  magic?: number;
  cards?: number;
  drawPileCount?: number;
  dice?: number[];
  // 振った人に続いていたスペルの効果（振り方を決めたもの）
  spellEffect?: SpellEffectView;
  target?: number;
  // かかった効果（ターンをまたいで効き続けるもの）
  effect?: { remainingTurns: number; effect?: SpellEffectView };
  order?: number[];
  winners?: number[];
  reason?: keyof typeof MATCH_END_REASON_LABELS;
  rewardCards?: { name: string }[];
  position?: { x: number; y: number };
  cost?: number;
  owner?: number;
  striker?: "ATTACKER" | "DEFENDER";
  damage?: number;
  remainingHitPoints?: number;
  returnedToHand?: boolean;
  attacker?: { attack: number; hitPoints: number };
  defender?: { attack: number; hitPoints: number };
  side?: "ATTACKER" | "DEFENDER";
  ability?: CreatureAbilityKind;
  percent?: number;
  toll?: number;
  multipliedToll?: number;
  positions?: { x: number; y: number }[];
  bonusPerTerritory?: number;
  bonusPerLevel?: number;
  // アイテムの効果の発動で、発動したカードの効果（core の ItemEffect。値は下限で止まる前の値）
  cardEffect?: {
    kind: ItemEffectKind;
    value?: number;
    percent?: number;
  };
  // 地形効果を無視するの、相手の増減と当てた後の値
  opponentChange?: {
    attackDelta: number;
    hitPointsDelta: number;
    attack: number;
    hitPoints: number;
  } | null;
  battleModifier?: {
    attackModifier: number;
    hitPointsModifier: number;
  } | null;
  battleRandomStats?: { minimum: number; maximum: number } | null;
  // 戦闘の発動で得た増減と、当てた後の値（AT・HP を変えない能力は null）
  change?: {
    attackDelta: number;
    hitPointsDelta: number;
    attack: number;
    hitPoints: number;
  } | null;
  level?: number;
  returnedCard?: { name: string };
  from?: { x: number; y: number };
  returnedTo?: { x: number; y: number } | null;
  element?: BoardTileElement;
  attack?: number;
};

function nameOf(names: string[], seat: number): string {
  return names[seat] ?? `参加者 ${seat + 1}`;
}

// アイテムの効果の具体的な効果。増減は決まった値を持つので、下限で止まったときに本来の値を添える
function itemEffectDetail(
  event: MatchEventView,
  effect: NonNullable<MatchEventView["cardEffect"]>,
): string {
  const m = MATCH_EVENT_MESSAGES;
  const change = event.change ?? {
    attackDelta: 0,
    hitPointsDelta: 0,
    attack: 0,
    hitPoints: 0,
  };
  const deltas = itemModifiersLabel(change.attackDelta, change.hitPointsDelta);
  switch (effect.kind) {
    case "ATTACK_MODIFIER":
    case "HIT_POINTS_MODIFIER":
      return m.battleStatChange(
        battleModifierChangeLabel(
          effect.kind === "ATTACK_MODIFIER" ? (effect.value ?? 0) : 0,
          effect.kind === "HIT_POINTS_MODIFIER" ? (effect.value ?? 0) : 0,
          change.attackDelta,
          change.hitPointsDelta,
        ),
        change.attack,
        change.hitPoints,
      );
    case "ATTACK_OVERRIDE":
      return m.attackOverrideEffect(
        effect.value ?? 0,
        deltas,
        change.attack,
        change.hitPoints,
      );
    case "ATTACK_MULTIPLIER":
      return m.attackMultiplierEffect(
        effect.percent ?? 0,
        deltas,
        change.attack,
        change.hitPoints,
      );
    case "IGNORE_TERRAIN_EFFECT": {
      const opponent = event.opponentChange ?? {
        attackDelta: 0,
        hitPointsDelta: 0,
        attack: 0,
        hitPoints: 0,
      };
      return m.ignoreTerrainEffect(
        event.side === "DEFENDER" ? m.battleAttacker : m.battleDefender,
        itemModifiersLabel(opponent.attackDelta, opponent.hitPointsDelta),
        opponent.attack,
        opponent.hitPoints,
      );
    }
  }
}

// AT・HP を変える能力の具体的な効果（ほかの能力は値を出さない）
function creatureAbilityEffect(event: MatchEventView): string | undefined {
  const m = MATCH_EVENT_MESSAGES;
  const { change } = event;
  if (!change) return undefined;
  if (event.battleRandomStats) {
    return m.battleRandomStatsEffect(
      event.battleRandomStats.minimum,
      event.battleRandomStats.maximum,
      itemModifiersLabel(change.attackDelta, change.hitPointsDelta),
      change.attack,
      change.hitPoints,
    );
  }
  return m.battleStatChange(
    battleModifierChangeLabel(
      event.battleModifier?.attackModifier ?? 0,
      event.battleModifier?.hitPointsModifier ?? 0,
      change.attackDelta,
      change.hitPointsDelta,
    ),
    change.attack,
    change.hitPoints,
  );
}

function body(event: MatchEventView, names: string[]): string {
  const m = MATCH_EVENT_MESSAGES;
  switch (event.__typename) {
    case "MatchCreatedEvent":
      return m.created;
    case "MatchDecksShuffledEvent":
      return m.decksShuffled;
    case "MatchHandsDealtEvent":
      return m.handsDealt(event.cards ?? 0);
    case "MatchTurnOrderDecidedEvent":
      return m.turnOrderDecided(
        (event.order ?? []).map((seat) => nameOf(names, seat)).join(" → "),
      );
    case "MatchCardDrawnEvent":
      return m.cardDrawn(event.card?.name ?? "");
    case "MatchCardDiscardedEvent":
      return m.cardDiscarded(event.card?.name ?? "");
    case "MatchDiscardPileShuffledEvent":
      return m.discardPileShuffled(event.drawPileCount ?? 0);
    case "MatchHandLimitExceededEvent":
      return m.handLimitExceeded(event.handCount ?? 0, event.maxHandCards ?? 0);
    case "MatchCreaturePlacedEvent":
      return m.creaturePlaced(
        event.card?.name ?? "",
        event.position?.x ?? 0,
        event.position?.y ?? 0,
        event.cost ?? 0,
      );
    case "MatchTerritoryInvadedEvent":
      return m.territoryInvaded(
        event.card?.name ?? "",
        event.defendingCreatureCard?.name ?? "",
        event.position?.x ?? 0,
        event.position?.y ?? 0,
        event.cost ?? 0,
      );
    case "MatchSpellUsedEvent":
      return m.spellUsed(event.card?.name ?? "", event.cost ?? 0);
    case "MatchItemUsedEvent":
      return m.itemUsed(event.card?.name ?? "", event.cost ?? 0);
    case "MatchItemSkippedEvent":
      return m.itemSkipped;
    case "MatchBattleStartedEvent":
      return m.battleStarted(
        event.attacker?.attack ?? 0,
        event.attacker?.hitPoints ?? 0,
        event.defender?.attack ?? 0,
        event.defender?.hitPoints ?? 0,
      );
    case "MatchBattleSupportEffectActivatedEvent":
      return m.battleStatModified(
        m.battleAttacker,
        m.adjacentTerritoriesSource(
          event.positions?.length ?? 0,
          event.bonusPerTerritory ?? 0,
        ),
        itemModifiersLabel(
          event.change?.attackDelta ?? 0,
          event.change?.hitPointsDelta ?? 0,
        ),
        event.change?.attack ?? 0,
        event.change?.hitPoints ?? 0,
      );
    case "MatchBattleTerrainEffectActivatedEvent":
      return m.battleStatModified(
        m.battleDefender,
        m.terrainSource(
          event.element ? ELEMENT_LABELS[event.element] : "",
          event.level ?? 0,
          event.bonusPerLevel ?? 0,
        ),
        itemModifiersLabel(
          event.change?.attackDelta ?? 0,
          event.change?.hitPointsDelta ?? 0,
        ),
        event.change?.attack ?? 0,
        event.change?.hitPoints ?? 0,
      );
    case "MatchBattleItemEffectActivatedEvent": {
      const effect = event.cardEffect;
      if (!effect) return "";
      const side =
        event.side === "DEFENDER" ? m.battleDefender : m.battleAttacker;
      return m.itemEffectActivated(
        m.sideTarget(side),
        event.card?.name ?? "",
        ITEM_EFFECT_LABELS[effect.kind],
        itemEffectDetail(event, effect),
      );
    }
    case "MatchBattleCreatureAbilityActivatedEvent":
      return m.abilityActivated(
        m.sideTarget(
          event.side === "DEFENDER" ? m.battleDefender : m.battleAttacker,
        ),
        event.ability ? CREATURE_ABILITY_LABELS[event.ability] : "",
        creatureAbilityEffect(event),
      );
    case "MatchCreatureStruckEvent":
      return m.creatureStruck(
        event.striker === "DEFENDER" ? m.battleDefender : m.battleAttacker,
        event.attack ?? 0,
        event.striker === "DEFENDER" ? m.battleAttacker : m.battleDefender,
        event.damage ?? 0,
        event.remainingHitPoints ?? 0,
      );
    case "MatchTerritoryConqueredEvent":
      return m.territoryConquered(
        event.position?.x ?? 0,
        event.position?.y ?? 0,
      );
    case "MatchInvasionRepelledEvent":
      // 移動で侵略したときは手札に戻らず、元の領地に戻るか倒れる（returnedTo は移動で生き残ったときだけ届く）
      if (event.returnedTo !== undefined && !event.returnedToHand) {
        return event.returnedTo
          ? m.movedInvasionRepelled(event.card?.name ?? "", true)
          : m.invasionRepelled(event.card?.name ?? "", false);
      }
      return m.invasionRepelled(
        event.card?.name ?? "",
        event.returnedToHand ?? false,
      );
    case "MatchCreatureMovedEvent":
      return m.creatureMoved(
        event.from?.x ?? 0,
        event.from?.y ?? 0,
        event.to?.x ?? 0,
        event.to?.y ?? 0,
      );
    case "MatchTerritoryInvadedByMoveEvent":
      return m.territoryInvadedByMove(
        event.card?.name ?? "",
        event.from?.x ?? 0,
        event.from?.y ?? 0,
        event.defendingCreatureCard?.name ?? "",
        event.position?.x ?? 0,
        event.position?.y ?? 0,
      );
    case "MatchTollMultiplierActivatedEvent":
      return m.abilityActivated(
        m.positionTarget(event.position?.x ?? 0, event.position?.y ?? 0),
        CREATURE_ABILITY_LABELS.TOLL_MULTIPLIER,
        m.tollMultiplierEffect(
          event.percent ?? 0,
          event.toll ?? 0,
          event.multipliedToll ?? 0,
        ),
      );
    case "MatchTollPaidEvent":
      return m.tollPaid(
        nameOf(names, event.owner ?? 0),
        event.position?.x ?? 0,
        event.position?.y ?? 0,
        event.magic ?? 0,
      );
    case "MatchTerritoryLeveledUpEvent":
      return m.territoryLeveledUp(
        event.position?.x ?? 0,
        event.position?.y ?? 0,
        event.level ?? 0,
        event.magic ?? 0,
      );
    case "MatchLandElementChangedEvent":
      return m.landElementChanged(
        event.position?.x ?? 0,
        event.position?.y ?? 0,
        event.element ? ELEMENT_LABELS[event.element] : "",
        event.magic ?? 0,
        event.baseLandValue ?? 0,
        event.multiplier ?? 0,
      );
    case "MatchCreatureExchangedEvent":
      return m.creatureExchanged(
        event.position?.x ?? 0,
        event.position?.y ?? 0,
        event.card?.name ?? "",
        event.returnedCard?.name ?? "",
        event.cost ?? 0,
      );
    case "MatchTerritoryRelinquishedEvent":
      return m.territoryRelinquished(
        event.position?.x ?? 0,
        event.position?.y ?? 0,
        event.magic ?? 0,
      );
    case "MatchMagicDepletedEvent":
      return m.magicDepleted(event.magic ?? 0);
    case "MatchDiceRolledEvent":
      return diceRolledLabel(
        event.value ?? 0,
        event.dice ?? [],
        event.spellEffect,
      );
    case "MatchSpellEffectStartedEvent":
      return spellEffectStartedLabel(
        nameOf(names, event.target ?? 0),
        event.effect?.effect,
        event.effect?.remainingTurns ?? 0,
      );
    case "MatchSpellEffectEndedEvent":
      return m.spellEffectEnded;
    case "MatchCreatureDamagedEvent":
      return m.creatureDamaged(
        event.position?.x ?? 0,
        event.position?.y ?? 0,
        event.damage ?? 0,
        event.remainingHitPoints ?? 0,
      );
    case "MatchCreatureDestroyedEvent":
      return m.creatureDestroyed(
        event.position?.x ?? 0,
        event.position?.y ?? 0,
      );
    case "MatchMagicGainedEvent":
      return m.magicGained(
        event.magic ?? 0,
        event.laps ?? 0,
        event.magicPerLap ?? 0,
      );
    case "MatchMovedEvent":
      return m.moved(event.to?.x ?? 0, event.to?.y ?? 0);
    case "MatchCheckpointPassedEvent":
      return m.checkpointPassed(
        event.checkpoint?.x ?? 0,
        event.checkpoint?.y ?? 0,
        event.magic ?? 0,
      );
    case "MatchLapCompletedEvent":
      return m.lapCompleted(event.magic ?? 0);
    case "MatchTurnEndedEvent":
      return m.turnEnded;
    case "MatchEndedEvent":
      return m.ended(
        (event.winners ?? []).map((seat) => nameOf(names, seat)).join("、"),
        event.reason ? MATCH_END_REASON_LABELS[event.reason] : "",
      );
    case "MatchRewardDrawnEvent":
      return m.rewardDrawn(
        (event.rewardCards ?? []).map((card) => card.name).join("、"),
      );
    case "MatchRewardsCompletedEvent":
      return m.rewardsCompleted;
    default:
      return m.unknown;
  }
}

// 描画したイベントの欄の 1 行（版の番号・誰が・何をしたか）。誰かが起こしたイベントだけ participant を持つ
export type ChainChange = {
  position: { x: number; y: number };
  from: number;
  to: number;
};

export function eventLine(
  event: MatchEventView,
  names: string[],
  chainChanges: ChainChange[] = [],
): string {
  const m = MATCH_EVENT_MESSAGES;
  const actor =
    event.participant === undefined
      ? undefined
      : nameOf(names, event.participant);
  const groups = new Map<string, ChainChange[]>();
  for (const change of chainChanges) {
    const key = `${change.from}>${change.to}`;
    groups.set(key, [...(groups.get(key) ?? []), change]);
  }
  const chains =
    groups.size === 0
      ? ""
      : m.chainChanged(
          [...groups.values()].map((group) =>
            m.chainChange(
              group[0].from,
              group[0].to,
              group.map((change) =>
                m.chainPosition(change.position.x, change.position.y),
              ),
            ),
          ),
        );
  return m.eventLine(event.revision, actor, `${body(event, names)}${chains}`);
}

type ChainSource = {
  changes?: {
    territoryValues: {
      position: { x: number; y: number };
      chainCount: number;
      previousChainCount?: number | null;
    }[];
  };
};

// 連鎖は増減のイベントが無く、core がイベントごとに変わった領地の前と今の連鎖の数を返す（core#168）。前が無い（配置した・
// 奪った）領地は、単独の領地の連鎖と同じ 1 から入ったと読む（2026-11-12 オーナー）
export function chainChangesOf(event: ChainSource): ChainChange[] {
  return (event.changes?.territoryValues ?? []).flatMap((territory) => {
    const from = territory.previousChainCount ?? 1;
    return from === territory.chainCount
      ? []
      : [{ position: territory.position, from, to: territory.chainCount }];
  });
}

// 読んだイベントを、開いた時点の版まで（欄に入れるだけ）とそれより後（順に描画する）に分ける。
// 開く前に起きたことは、今の状態として出ているため描画しない
export function splitEvents<T extends { revision: number }>(
  events: T[],
  shownRevision: number,
): { silent: T[]; play: T[] } {
  return {
    silent: events.filter((event) => event.revision <= shownRevision),
    play: events.filter((event) => event.revision > shownRevision),
  };
}

// 欄に足す。同じ版は 1 つだけにする（差分の読み込みが重なって同じイベントを 2 回読んでも、欄に 2 つ並べないため）
export function mergeShown<T extends { revision: number }>(
  shown: T[],
  events: T[],
): T[] {
  const known = new Set(shown.map((event) => event.revision));
  return [...shown, ...events.filter((event) => !known.has(event.revision))];
}
