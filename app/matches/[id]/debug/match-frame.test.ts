import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyEvent,
  eventDurationMs,
  type FrameCard,
  type FrameTerritory,
  type MatchFrame,
  type PlayEvent,
} from "./match-frame.ts";

const BASE = { x: 0, y: 0 };
const ROLLING = "ROLLING" as MatchFrame["phase"];
const ENDING = "ENDING" as MatchFrame["phase"];
const DRAGON: FrameCard = {
  __typename: "CreatureCardInfo",
  id: "c1",
  name: "ドラゴン",
  cost: 30,
  rarity: "NORMAL" as FrameCard["rarity"],
  attack: 30,
  hitPoints: 20,
};
const TERRITORY: FrameTerritory = {
  position: { x: 1, y: 0 },
  owner: 1,
  level: 1,
  value: 100,
  toll: 60,
  creature: {
    id: 1,
    hitPoints: 20,
    card: { id: "c1", name: "ドラゴン", attack: 30 },
  },
};

function participant(turnOrder: number) {
  return {
    kind: "PLAYER" as MatchFrame["participants"][number]["kind"],
    avatar: { name: `席${turnOrder}` },
    position: { x: 0, y: 0 },
    magic: 600,
    totalMagic: 600,
    hand: [DRAGON],
    drawPileCount: 3,
    turnOrder,
    passedCheckpoints: [],
    rewardReceived: false,
    rewardCards: [],
  };
}

// 席 1 が先の番
function frame(overrides: Partial<MatchFrame> = {}): MatchFrame {
  return {
    revision: 10,
    round: 1,
    phase: ROLLING,
    dice: null,
    remainingSteps: 0,
    currentParticipant: 1,
    participants: [participant(1), participant(0)],
    territories: [],
    invasion: null,
    battle: null,
    outcome: null,
    ...overrides,
  };
}

function event(
  __typename: string,
  fields: Partial<PlayEvent> = {},
  phase: MatchFrame["phase"] = ROLLING,
): PlayEvent {
  return {
    __typename,
    revision: 11,
    changes: { phase, totalMagics: [], territoryValues: [] },
    participant: 1,
    ...fields,
  };
}

const INVASION = {
  position: { x: 1, y: 0 },
  card: { ...DRAGON, id: "c9", name: "ナイト", attack: 40 },
  hitPoints: 20,
};

const BATTLE = {
  attacker: { attack: 40, hitPoints: 20 },
  defender: { attack: 30, hitPoints: 25 },
};

describe("applyEvent", () => {
  it("侵略すると手札から抜けて魔力が減り、領地に入らず侵略の欄に出る", () => {
    const next = applyEvent(
      frame({ territories: [TERRITORY] }),
      event("MatchTerritoryInvadedEvent", {
        card: INVASION.card,
        handIndex: 0,
        position: INVASION.position,
        cost: 30,
      }),
      BASE,
    );
    assert.deepEqual(next.participants[1].hand, []);
    assert.equal(next.participants[1].magic, 570);
    assert.deepEqual(next.invasion, INVASION);
    assert.deepEqual(next.territories, [TERRITORY]);
  });

  it("アイテムを出した人の手札から抜けて魔力が減る", () => {
    const next = applyEvent(
      frame(),
      event("MatchItemUsedEvent", {
        participant: 0,
        handIndex: 0,
        cost: 20,
      }),
      BASE,
    );
    assert.deepEqual(next.participants[0].hand, []);
    assert.equal(next.participants[0].magic, 580);
    assert.equal(next.participants[1].magic, 600);
  });

  it("戦闘が始まると、効果を当てる前の両方の AT・HP が出る", () => {
    const next = applyEvent(
      frame({ invasion: INVASION }),
      event("MatchBattleStartedEvent", {
        attacker: { attack: 40, hitPoints: 20 },
        defender: { attack: 30, hitPoints: 25 },
      }),
      BASE,
    );
    assert.deepEqual(next.battle, BATTLE);
  });

  it("効果のイベントは、受けた側の AT・HP を core の値に置き換える", () => {
    const start = frame({ invasion: INVASION, battle: BATTLE });
    const attacker = applyEvent(
      start,
      event("MatchBattleStatModifiedEvent", {
        side: "ATTACKER",
        attack: 60,
        hitPoints: 20,
      }),
      BASE,
    );
    assert.deepEqual(attacker.battle?.attacker, { attack: 60, hitPoints: 20 });
    assert.deepEqual(attacker.battle?.defender, BATTLE.defender);
    const defender = applyEvent(
      attacker,
      event("MatchBattleStatModifiedEvent", {
        side: "DEFENDER",
        attack: 30,
        hitPoints: 45,
      }),
      BASE,
    );
    assert.deepEqual(defender.battle?.defender, { attack: 30, hitPoints: 45 });
  });

  it("攻撃は戦闘の中の体力だけを変え、領地のクリーチャーの体力は戦闘が終わるまで変えない", () => {
    const start = frame({
      territories: [TERRITORY],
      invasion: INVASION,
      battle: BATTLE,
    });
    const struck = applyEvent(
      start,
      event("MatchCreatureStruckEvent", {
        striker: "ATTACKER",
        remainingHitPoints: 5,
      }),
      BASE,
    );
    assert.equal(struck.battle?.defender.hitPoints, 5);
    assert.equal(struck.battle?.attacker.hitPoints, 20);
    const countered = applyEvent(
      struck,
      event("MatchCreatureStruckEvent", {
        striker: "DEFENDER",
        remainingHitPoints: 12,
      }),
      BASE,
    );
    assert.equal(countered.battle?.attacker.hitPoints, 12);
    assert.equal(countered.territories[0].creature.hitPoints, 20);
  });

  it("奪うと領地の持ち主とクリーチャーが変わり、レベルは残り、侵略の欄が消える", () => {
    const next = applyEvent(
      frame({
        territories: [{ ...TERRITORY, owner: 0, level: 2 }],
        invasion: INVASION,
        battle: BATTLE,
      }),
      event("MatchTerritoryConqueredEvent", {
        position: INVASION.position,
        creature: 7,
        territoryHitPoints: 8,
      }),
      BASE,
    );
    assert.equal(next.invasion, null);
    assert.equal(next.battle, null);
    assert.equal(next.territories[0].owner, 1);
    assert.equal(next.territories[0].level, 2);
    assert.deepEqual(next.territories[0].creature, {
      id: 7,
      hitPoints: 8,
      card: { id: "c9", name: "ナイト", attack: 40 },
    });
  });

  it("侵略に失敗すると、領地のクリーチャーの体力が残る値になる", () => {
    const next = applyEvent(
      frame({
        territories: [TERRITORY],
        invasion: INVASION,
        battle: BATTLE,
      }),
      event("MatchInvasionRepelledEvent", {
        card: INVASION.card,
        position: INVASION.position,
        returnedToHand: true,
        territoryHitPoints: 9,
      }),
      BASE,
    );
    assert.equal(next.battle, null);
    assert.equal(next.territories[0].creature.hitPoints, 9);
  });

  it("侵略に失敗して生きていれば手札の最後に戻り、倒れていれば戻らない", () => {
    const returned = applyEvent(
      frame({ invasion: INVASION }),
      event("MatchInvasionRepelledEvent", {
        card: INVASION.card,
        returnedToHand: true,
      }),
      BASE,
    );
    assert.equal(returned.invasion, null);
    assert.deepEqual(
      returned.participants[1].hand.map((card) => card.id),
      ["c1", "c9"],
    );
    const destroyed = applyEvent(
      frame({ invasion: INVASION }),
      event("MatchInvasionRepelledEvent", {
        card: INVASION.card,
        returnedToHand: false,
      }),
      BASE,
    );
    assert.equal(destroyed.invasion, null);
    assert.deepEqual(
      destroyed.participants[1].hand.map((card) => card.id),
      ["c1"],
    );
  });

  it("元のフレームを書き換えない", () => {
    const before = frame();
    applyEvent(before, event("MatchMovedEvent", { to: { x: 1, y: 0 } }), BASE);
    assert.deepEqual(before, frame());
  });

  it("どのイベントでも版が進む", () => {
    assert.equal(
      applyEvent(frame(), event("MatchTurnOrderDecidedEvent"), BASE).revision,
      11,
    );
  });

  it("引いたカードが手札の最後に入り、その人の山札だけが減る", () => {
    const next = applyEvent(
      frame(),
      event("MatchCardDrawnEvent", { card: { ...DRAGON, id: "c2" } }),
      BASE,
    );
    assert.deepEqual(
      next.participants[1].hand.map((card) => card.id),
      ["c1", "c2"],
    );
    assert.equal(next.participants[1].drawPileCount, 2);
    assert.equal(next.participants[0].drawPileCount, 3);
  });

  it("捨てたカードが手札の番号で抜ける", () => {
    const next = applyEvent(
      frame(),
      event("MatchCardDiscardedEvent", { handIndex: 0 }),
      BASE,
    );
    assert.deepEqual(next.participants[1].hand, []);
  });

  it("サイコロの目が残りの歩数になり、進むと 1 減ってコマが動き、移動の途中は段階が無い", () => {
    const rolled = applyEvent(
      frame(),
      event("MatchDiceRolledEvent", { value: 2 }, null),
      BASE,
    );
    assert.equal(rolled.dice, 2);
    assert.equal(rolled.remainingSteps, 2);
    const moved = applyEvent(
      rolled,
      event("MatchMovedEvent", { to: { x: 1, y: 0 } }, null),
      BASE,
    );
    assert.equal(moved.remainingSteps, 1);
    assert.deepEqual(moved.participants[1].position, { x: 1, y: 0 });
    assert.equal(moved.phase, null);
  });

  it("チェックポイントを通ると魔力が増えて記録され、周回で記録が消える", () => {
    const passed = applyEvent(
      frame(),
      event("MatchCheckpointPassedEvent", {
        checkpoint: { x: 3, y: 0 },
        magic: 100,
      }),
      BASE,
    );
    assert.equal(passed.participants[1].magic, 700);
    assert.equal(passed.participants[1].passedCheckpoints.length, 1);
    const lapped = applyEvent(
      passed,
      event("MatchLapCompletedEvent", { magic: 300 }),
      BASE,
    );
    assert.equal(lapped.participants[1].magic, 1000);
    assert.deepEqual(lapped.participants[1].passedCheckpoints, []);
  });

  it("配置すると手札から抜けて魔力を払い、領地に変わった価値と通行料で出る", () => {
    const next = applyEvent(
      frame(),
      {
        ...event("MatchCreatureDeployedEvent", {
          handIndex: 0,
          card: DRAGON,
          creature: 1,
          position: { x: 1, y: 0 },
          cost: 30,
        }),
        changes: {
          phase: ENDING,
          totalMagics: [{ participant: 1, totalMagic: 670 }],
          territoryValues: [{ position: { x: 1, y: 0 }, value: 100, toll: 60 }],
        },
      },
      BASE,
    );
    assert.deepEqual(next.participants[1].hand, []);
    assert.equal(next.participants[1].magic, 570);
    assert.equal(next.participants[1].totalMagic, 670);
    assert.equal(next.phase, ENDING);
    assert.deepEqual(next.territories, [TERRITORY]);
  });

  it("連鎖で変わったほかの領地の価値と通行料も、届いた値になる", () => {
    const next = applyEvent(
      frame({ territories: [TERRITORY] }),
      {
        ...event("MatchTurnEndedEvent"),
        changes: {
          phase: ROLLING,
          totalMagics: [],
          territoryValues: [{ position: { x: 1, y: 0 }, value: 150, toll: 90 }],
        },
      },
      BASE,
    );
    assert.equal(next.territories[0].value, 150);
    assert.equal(next.territories[0].toll, 90);
  });

  it("届かなかった総魔力と領地の価値は前のフレームのまま", () => {
    const before = frame({ territories: [TERRITORY] });
    before.participants[1] = { ...before.participants[1], totalMagic: 700 };
    const next = applyEvent(
      before,
      event("MatchMovedEvent", { to: BASE }),
      BASE,
    );
    assert.equal(next.participants[1].totalMagic, 700);
    assert.equal(next.territories[0].value, 100);
    assert.equal(next.territories[0].toll, 60);
  });

  it("通行料は払った人から受け取る人へ移る", () => {
    const next = applyEvent(
      frame(),
      event("MatchTollPaidEvent", { owner: 0, magic: 60 }),
      BASE,
    );
    assert.equal(next.participants[1].magic, 540);
    assert.equal(next.participants[0].magic, 660);
  });

  it("手放すと魔力を受け取り、その領地が消える", () => {
    const next = applyEvent(
      frame({ territories: [TERRITORY] }),
      event("MatchTerritoryRelinquishedEvent", {
        position: { x: 1, y: 0 },
        creature: 1,
        magic: 80,
      }),
      BASE,
    );
    assert.equal(next.participants[1].magic, 680);
    assert.deepEqual(next.territories, []);
  });

  it("魔力が枯渇すると与えられた魔力で拠点に戻り、チェックポイントの記録が消える", () => {
    const before = frame();
    before.participants[1] = {
      ...before.participants[1],
      magic: -40,
      position: { x: 5, y: 0 },
      passedCheckpoints: [{ x: 3, y: 0 }],
    };
    const next = applyEvent(
      before,
      event("MatchMagicDepletedEvent", { magic: 600 }),
      { x: 9, y: 9 },
    );
    assert.equal(next.participants[1].magic, 600);
    assert.deepEqual(next.participants[1].position, { x: 9, y: 9 });
    assert.deepEqual(next.participants[1].passedCheckpoints, []);
  });

  it("ターンが終わると turnOrder の次の人の番になり、目と歩数が消える", () => {
    const next = applyEvent(
      frame({ dice: 3, remainingSteps: 1 }),
      event("MatchTurnEndedEvent"),
      BASE,
    );
    assert.equal(next.currentParticipant, 0);
    assert.equal(next.round, 1);
    assert.equal(next.dice, null);
    assert.equal(next.remainingSteps, 0);
  });

  it("最後の人のターンが終わると最初の人に戻り、ラウンドが進む", () => {
    const next = applyEvent(
      frame({ currentParticipant: 0 }),
      event("MatchTurnEndedEvent", { participant: 0 }),
      BASE,
    );
    assert.equal(next.currentParticipant, 1);
    assert.equal(next.round, 2);
  });

  it("対戦が終わると結果が入り、戦利品を受け取った人に出る", () => {
    const ended = applyEvent(
      frame(),
      event("MatchEndedEvent", {
        winners: [1],
        ranks: [2, 1],
        reason: "ROUND_LIMIT" as PlayEvent["reason"],
      }),
      BASE,
    );
    assert.deepEqual(ended.outcome, {
      winners: [1],
      ranks: [2, 1],
      reason: "ROUND_LIMIT",
    });
    const rewarded = applyEvent(
      ended,
      event("MatchRewardDrawnEvent", {
        participant: 0,
        rewardCards: [{ name: "報酬" }],
      }),
      BASE,
    );
    assert.equal(rewarded.participants[0].rewardReceived, true);
    assert.deepEqual(rewarded.participants[0].rewardCards, [{ name: "報酬" }]);
  });
});

describe("eventDurationMs", () => {
  it("画面に映らないイベントは待たない", () => {
    assert.equal(eventDurationMs(event("MatchDecksShuffledEvent")), 0);
  });

  it("画面に映るイベントは待つ", () => {
    assert.ok(eventDurationMs(event("MatchMovedEvent")) > 0);
  });
});
