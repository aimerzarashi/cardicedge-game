import type { BoardTileElement, EffectKind } from "@/graphql/graphql";
import { ELEMENT_LABELS } from "../boards/board-layout.ts";
import {
  battleModifierChangeLabel,
  diceRolledLabel,
  EFFECT_LABELS,
  itemModifiersLabel,
  MATCH_END_REASON_LABELS,
  MATCH_EVENT_MESSAGES,
  overrideRangeLabel,
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
  percent?: number;
  toll?: number;
  multipliedToll?: number;
  positions?: { x: number; y: number }[];
  bonusPerTerritory?: number;
  bonusPerLevel?: number;
  // クリーチャー・アイテムの効果の発動で、発動したカードの効果（core の Effect。値は下限で止まる前の値・上書きの範囲）
  activatedEffect?: {
    kind: EffectKind;
    value?: number;
    minimum?: number;
    maximum?: number;
    percent?: number;
    amount?: number;
  };
  // 地形効果を無視するの、相手の増減と当てた後の値
  opponentChange?: {
    attackDelta: number;
    hitPointsDelta: number;
    attack: number;
    hitPoints: number;
  } | null;
  // 戦闘の発動で得た増減と、当てた後の値（AT・HP を変えない効果は null）
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

// 効果の具体的な効果（クリーチャーとアイテムで共有する）。増減は決まった値を持つので、下限で止まったときに本来の値を添える。
// AT・HP を変えない効果（先制・後手・攻撃無効・侵略と移動）は値を出さない
function effectDetail(
  event: MatchEventView,
  effect: NonNullable<MatchEventView["activatedEffect"]>,
): string | undefined {
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
    case "HIT_POINTS_OVERRIDE":
      return m.overrideEffect(
        effect.kind === "ATTACK_OVERRIDE" ? "AT" : "HP",
        overrideRangeLabel(effect.minimum ?? 0, effect.maximum ?? 0),
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
    default:
      return undefined;
  }
}

function body(event: MatchEventView, names: string[]): string {
  const m = MATCH_EVENT_MESSAGES;
  switch (event.__typename) {
    case "MatchCreatedEvent":
      return m.created;
    case "MatchDrawPilesShuffledEvent":
      return m.drawPilesShuffled;
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
      // 支援効果は守る側にも付く（core#178）
      return m.battleStatModified(
        event.side === "DEFENDER" ? m.battleDefender : m.battleAttacker,
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
    case "MatchBattleItemEffectActivatedEvent":
    case "MatchBattleCreatureEffectActivatedEvent": {
      const effect = event.activatedEffect;
      if (!effect) return "";
      const side =
        event.side === "DEFENDER" ? m.battleDefender : m.battleAttacker;
      const card = event.card?.name ?? "";
      return m.effectActivated(
        m.sideTarget(side),
        event.__typename === "MatchBattleItemEffectActivatedEvent"
          ? m.itemOwner(card)
          : m.creatureOwner(card),
        EFFECT_LABELS[effect.kind],
        effectDetail(event, effect),
      );
    }
    case "MatchCreatureStruckEvent":
      return m.creatureStruck(
        event.striker === "DEFENDER" ? m.battleDefender : m.battleAttacker,
        event.attack ?? 0,
        event.striker === "DEFENDER" ? m.battleAttacker : m.battleDefender,
        event.damage ?? 0,
        event.remainingHitPoints ?? 0,
      );
    case "MatchInvadingCreatureDestroyedEvent":
      return m.invadingCreatureDestroyed(event.card?.name ?? "");
    case "MatchDefendingCreatureDestroyedEvent":
      return m.defendingCreatureDestroyed(event.card?.name ?? "");
    case "MatchInvasionSucceededEvent":
      return m.invasionSucceeded(
        event.position?.x ?? 0,
        event.position?.y ?? 0,
      );
    case "MatchInvasionFailedEvent":
      // 生き残れば手札（手札から侵略したとき）か元の領地（移動で侵略したとき。returnedTo が届く）に戻る
      if (event.returnedToHand) {
        return m.invasionFailedReturned(event.card?.name ?? "", "hand");
      }
      if (event.returnedTo) {
        return m.invasionFailedReturned(event.card?.name ?? "", "origin");
      }
      return m.invasionFailed;
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
    case "MatchDestructionCreatureEffectActivatedEvent": {
      // 破壊されたときの効果は、持ち主に「クリーチャー「〜」の」効果が発動した形（core#182）。魔力を得るは額を添える
      const activated = event.activatedEffect;
      return m.effectActivated(
        m.ownerTarget(nameOf(names, event.owner ?? 0)),
        m.creatureOwner(event.card?.name ?? ""),
        activated ? EFFECT_LABELS[activated.kind] : "",
        activated?.amount !== undefined
          ? `魔力 +${activated.amount}`
          : undefined,
      );
    }
    case "MatchCardReturnedToHandEvent":
      return m.cardReturnedToHand(
        event.card?.name ?? "",
        nameOf(names, event.owner ?? 0),
      );
    case "MatchMagicReceivedEvent":
      return m.magicReceived(nameOf(names, event.owner ?? 0), event.magic ?? 0);
    case "MatchTollCreatureEffectActivatedEvent":
      // 通行料の倍率の発動は持ち主のカードを持たないので、位置だけを書く
      return m.effectActivated(
        m.positionTarget(event.position?.x ?? 0, event.position?.y ?? 0),
        "",
        EFFECT_LABELS.TOLL_MULTIPLIER,
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
    case "MatchLandLeveledUpEvent":
      return m.landLeveledUp(
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
    case "MatchBoardCreatureDestroyedEvent":
      return m.boardCreatureDestroyed(
        event.position?.x ?? 0,
        event.position?.y ?? 0,
        event.card?.name ?? "",
      );
    case "MatchMagicGainedEvent":
      return m.magicGained(
        event.magic ?? 0,
        event.laps ?? 0,
        event.magicPerLap ?? 0,
      );
    case "MatchPieceMovedEvent":
      return m.pieceMoved(event.to?.x ?? 0, event.to?.y ?? 0);
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
    case "MatchAllRewardsReceivedEvent":
      return m.allRewardsReceived;
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
