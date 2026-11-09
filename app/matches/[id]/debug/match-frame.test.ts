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
  hitPoints: 20,
};
const TERRITORY: FrameTerritory = {
  position: { x: 1, y: 0 },
  owner: 1,
  level: 1,
  value: 100,
  toll: 60,
  creature: { id: 1, hitPoints: 20, card: { id: "c1", name: "ドラゴン" } },
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

describe("applyEvent", () => {
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
