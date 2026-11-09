import { MATCH_END_REASON_LABELS, MATCH_EVENT_MESSAGES } from "../messages.ts";

// core の MatchEvent の種類ごとの型を、画面が使う項目だけの形で受ける（__typename で見分ける）
export type MatchEventView = {
  __typename: string;
  revision: number;
  participant?: number;
  to?: { x: number; y: number };
  value?: number;
  card?: { name: string };
  checkpoint?: { x: number; y: number };
  magic?: number;
  cards?: number;
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
};

function nameOf(names: string[], seat: number): string {
  return names[seat] ?? `参加者 ${seat + 1}`;
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
    case "MatchCreatureDeployedEvent":
      return m.creatureDeployed(
        event.card?.name ?? "",
        event.position?.x ?? 0,
        event.position?.y ?? 0,
        event.cost ?? 0,
      );
    case "MatchTerritoryInvadedEvent":
      return m.territoryInvaded(
        event.card?.name ?? "",
        event.position?.x ?? 0,
        event.position?.y ?? 0,
        event.cost ?? 0,
      );
    case "MatchItemUsedEvent":
      return m.itemUsed(event.card?.name ?? "", event.cost ?? 0);
    case "MatchItemSkippedEvent":
      return m.itemSkipped;
    case "MatchCreatureStruckEvent":
      return m.creatureStruck(
        event.striker === "DEFENDER" ? m.battleDefender : m.battleAttacker,
        event.damage ?? 0,
        event.remainingHitPoints ?? 0,
      );
    case "MatchTerritoryConqueredEvent":
      return m.territoryConquered(
        event.position?.x ?? 0,
        event.position?.y ?? 0,
      );
    case "MatchInvasionRepelledEvent":
      return m.invasionRepelled(
        event.card?.name ?? "",
        event.returnedToHand ?? false,
      );
    case "MatchTollPaidEvent":
      return m.tollPaid(
        nameOf(names, event.owner ?? 0),
        event.position?.x ?? 0,
        event.position?.y ?? 0,
        event.magic ?? 0,
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
      return m.diceRolled(event.value ?? 0);
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
export function eventLine(event: MatchEventView, names: string[]): string {
  const actor =
    event.participant === undefined
      ? undefined
      : nameOf(names, event.participant);
  return MATCH_EVENT_MESSAGES.eventLine(
    event.revision,
    actor,
    body(event, names),
  );
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
