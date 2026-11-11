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
    discardPile: [],
    curse: null,
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
    diceFaces: [],
    remainingSteps: 0,
    currentParticipant: 1,
    participants: [participant(1), participant(0)],
    territories: [],
    invasion: null,
    battle: null,
    landElements: [],
    landLevels: [],
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

  it("アイテムを出した人の手札から抜けて捨て札に入り、魔力が減る", () => {
    const next = applyEvent(
      frame(),
      event("MatchItemUsedEvent", {
        participant: 0,
        handIndex: 0,
        card: { ...DRAGON, id: "i1", name: "剣" },
        cost: 20,
      }),
      BASE,
    );
    assert.deepEqual(next.participants[0].hand, []);
    assert.deepEqual(next.participants[0].discardPile, [
      { id: "i1", name: "剣" },
    ]);
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
    // 倒されたクリーチャーは、守った持ち主の捨て札に入る
    assert.deepEqual(next.participants[0].discardPile, [
      { id: "c1", name: "ドラゴン" },
    ]);
    assert.deepEqual(next.participants[1].discardPile, []);
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

  it("侵略に失敗して生きていれば手札の最後に戻り、倒れていれば捨て札に入る", () => {
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
    assert.deepEqual(returned.participants[1].discardPile, []);
    assert.deepEqual(destroyed.participants[1].discardPile, [
      { id: "c9", name: "ナイト" },
    ]);
  });

  it("領地のレベルを上げると、魔力が減ってその領地のレベルだけが変わる", () => {
    const other = { ...TERRITORY, position: { x: 2, y: 0 } };
    const next = applyEvent(
      frame({ territories: [TERRITORY, other] }),
      event("MatchTerritoryLeveledUpEvent", {
        position: TERRITORY.position,
        level: 3,
        magic: 300,
      }),
      BASE,
    );
    assert.equal(next.participants[1].magic, 300);
    assert.equal(next.territories[0].level, 3);
    assert.equal(next.territories[1].level, 1);
  });

  it("クリーチャーを交換すると、手札と魔力と領地のクリーチャーが変わり、レベルは残る", () => {
    const returned = { ...DRAGON, id: "c8", name: "ゴブリン" };
    const next = applyEvent(
      frame({ territories: [{ ...TERRITORY, level: 2 }] }),
      event("MatchCreatureExchangedEvent", {
        position: TERRITORY.position,
        handIndex: 0,
        card: DRAGON,
        creature: 9,
        cost: 30,
        returnedCard: returned,
      }),
      BASE,
    );
    assert.deepEqual(
      next.participants[1].hand.map((card) => card.id),
      ["c8"],
    );
    assert.equal(next.participants[1].magic, 570);
    assert.equal(next.territories[0].level, 2);
    assert.deepEqual(next.territories[0].creature, {
      id: 9,
      hitPoints: 20,
      card: { id: "c1", name: "ドラゴン", attack: 30 },
    });
  });

  it("土地の属性を変えると、魔力が減り、その位置の属性だけが置き換わる", () => {
    const next = applyEvent(
      frame({
        landElements: [
          { position: { x: 1, y: 0 }, element: "WIND" as const },
          { position: { x: 2, y: 0 }, element: "EARTH" as const },
        ],
      }),
      event("MatchLandElementChangedEvent", {
        position: { x: 1, y: 0 },
        element: "WATER",
        magic: 200,
      }),
      BASE,
    );
    assert.equal(next.participants[1].magic, 400);
    assert.deepEqual(next.landElements, [
      { position: { x: 2, y: 0 }, element: "EARTH" },
      { position: { x: 1, y: 0 }, element: "WATER" },
    ]);
  });

  it("空き地に配置すると、その土地に残っていたレベルを引き継ぐ", () => {
    const next = applyEvent(
      frame({ landLevels: [{ position: { x: 3, y: 0 }, level: 3 }] }),
      event("MatchCreatureDeployedEvent", {
        card: DRAGON,
        handIndex: 0,
        creature: 5,
        position: { x: 3, y: 0 },
        cost: 30,
      }),
      BASE,
    );
    assert.equal(next.territories[0].level, 3);
  });

  it("レベルを上げると土地のレベルも変わり、手放しても土地に残る", () => {
    const leveled = applyEvent(
      frame({ territories: [TERRITORY] }),
      event("MatchTerritoryLeveledUpEvent", {
        position: TERRITORY.position,
        level: 2,
        magic: 100,
      }),
      BASE,
    );
    assert.deepEqual(leveled.landLevels, [
      { position: TERRITORY.position, level: 2 },
    ]);
    const relinquished = applyEvent(
      leveled,
      event("MatchTerritoryRelinquishedEvent", {
        position: TERRITORY.position,
        creature: 1,
        magic: 80,
      }),
      BASE,
    );
    assert.deepEqual(relinquished.territories, []);
    assert.deepEqual(relinquished.landLevels, [
      { position: TERRITORY.position, level: 2 },
    ]);
  });

  it("空き地へ動かすと、領地が行き先へ移り、行き先の土地のレベルになる", () => {
    const next = applyEvent(
      frame({
        territories: [TERRITORY],
        landLevels: [{ position: { x: 1, y: 0 }, level: 3 }],
      }),
      event("MatchCreatureMovedEvent", {
        from: TERRITORY.position,
        to: { x: 2, y: 0 },
        creature: 1,
      }),
      BASE,
    );
    assert.deepEqual(next.territories, [
      { ...TERRITORY, position: { x: 2, y: 0 }, level: 1 },
    ]);
  });

  it("移動で侵略して奪うと、同じクリーチャーが移り、元の土地が空く", () => {
    const own = { ...TERRITORY, owner: 1 };
    const other = {
      ...TERRITORY,
      position: { x: 2, y: 0 },
      owner: 0,
      creature: {
        id: 2,
        hitPoints: 10,
        card: { id: "c2", name: "敵", attack: 5 },
      },
    };
    const invaded = applyEvent(
      frame({ territories: [own, other] }),
      event("MatchTerritoryInvadedByMoveEvent", {
        from: own.position,
        position: other.position,
        creature: 1,
      }),
      BASE,
    );
    assert.deepEqual(invaded.invasion?.from, own.position);
    const conquered = applyEvent(
      invaded,
      event("MatchTerritoryConqueredEvent", {
        position: other.position,
        creature: 1,
        territoryHitPoints: 18,
      }),
      BASE,
    );
    assert.equal(conquered.invasion, null);
    assert.deepEqual(conquered.territories, [
      { ...other, owner: 1, creature: { ...own.creature, hitPoints: 18 } },
    ]);
  });

  it("移動で侵略して生き残ると元の領地に戻り、倒れると元の土地が空いて捨て札に入る", () => {
    const own = { ...TERRITORY, owner: 1 };
    const invasion = {
      ...INVASION,
      position: { x: 2, y: 0 },
      from: own.position,
    };
    const returned = applyEvent(
      frame({ territories: [own], invasion }),
      event("MatchInvasionRepelledEvent", {
        card: INVASION.card,
        position: { x: 2, y: 0 },
        returnedToHand: false,
        returnedTo: own.position,
        returnedHitPoints: 7,
      }),
      BASE,
    );
    assert.equal(returned.territories[0].creature.hitPoints, 7);
    assert.deepEqual(
      returned.participants[1].hand.map((card) => card.id),
      ["c1"],
    );
    const destroyed = applyEvent(
      frame({ territories: [own], invasion }),
      event("MatchInvasionRepelledEvent", {
        card: INVASION.card,
        position: { x: 2, y: 0 },
        returnedToHand: false,
        returnedTo: null,
        returnedHitPoints: null,
      }),
      BASE,
    );
    assert.deepEqual(destroyed.territories, []);
    assert.deepEqual(returned.participants[1].discardPile, []);
    assert.deepEqual(destroyed.participants[1].discardPile, [
      { id: "c1", name: "ドラゴン" },
    ]);
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

  it("捨てたカードが手札の番号で抜けて捨て札に入る", () => {
    const next = applyEvent(
      frame(),
      event("MatchCardDiscardedEvent", { handIndex: 0, card: DRAGON }),
      BASE,
    );
    assert.deepEqual(next.participants[1].hand, []);
    assert.deepEqual(next.participants[1].discardPile, [
      { id: "c1", name: "ドラゴン" },
    ]);
  });

  it("呪いをかけると対象に付き、対象がターンを終えると 1 減り、解けたイベントで消える", () => {
    const cast = applyEvent(
      frame(),
      event("MatchCurseCastEvent", {
        target: 0,
        curse: { remainingTurns: 2, effect: { value: 6 } },
      }),
      BASE,
    );
    assert.deepEqual(cast.participants[0].curse, {
      value: 6,
      remainingTurns: 2,
    });
    assert.equal(cast.participants[1].curse, null);
    const passed = applyEvent(
      { ...cast, currentParticipant: 0 },
      event("MatchTurnEndedEvent", { participant: 0 }),
      BASE,
    );
    assert.equal(passed.participants[0].curse?.remainingTurns, 1);
    const removed = applyEvent(
      passed,
      event("MatchCurseRemovedEvent", { participant: 0 }),
      BASE,
    );
    assert.equal(removed.participants[0].curse, null);
  });

  it("ダメージでクリーチャーの HP が減り、破壊されると土地が空き、持ち主の捨て札に入る", () => {
    const damaged = applyEvent(
      frame({ territories: [{ ...TERRITORY, owner: 0 }] }),
      event("MatchCreatureDamagedEvent", {
        position: { x: 1, y: 0 },
        remainingHitPoints: 0,
      }),
      BASE,
    );
    assert.equal(damaged.territories[0].creature.hitPoints, 0);
    const destroyed = applyEvent(
      damaged,
      event("MatchCreatureDestroyedEvent", { position: { x: 1, y: 0 } }),
      BASE,
    );
    assert.deepEqual(destroyed.territories, []);
    assert.deepEqual(destroyed.participants[0].discardPile, [
      { id: "c1", name: "ドラゴン" },
    ]);
  });

  it("スペルで魔力を得ると、その人の魔力だけが増える", () => {
    const next = applyEvent(
      frame(),
      event("MatchMagicGainedEvent", { magic: 200 }),
      BASE,
    );
    assert.equal(next.participants[1].magic, 800);
    assert.equal(next.participants[0].magic, 600);
  });

  it("複数のサイコロを振ると、合計が残りの歩数になり、1 個ずつの目も残る", () => {
    const next = applyEvent(
      frame(),
      event("MatchDiceRolledEvent", { value: 8, dice: [3, 5] }, null),
      BASE,
    );
    assert.equal(next.dice, 8);
    assert.equal(next.remainingSteps, 8);
    assert.deepEqual(next.diceFaces, [3, 5]);
  });

  it("スペルを使うと手札から抜けて捨て札に入り、魔力が減る", () => {
    const next = applyEvent(
      frame(),
      event("MatchSpellUsedEvent", {
        handIndex: 0,
        card: {
          ...DRAGON,
          __typename: "SpellCardInfo",
          id: "s1",
          name: "ホープ",
        },
        cost: 40,
      }),
      BASE,
    );
    assert.deepEqual(next.participants[1].hand, []);
    assert.deepEqual(next.participants[1].discardPile, [
      { id: "s1", name: "ホープ" },
    ]);
    assert.equal(next.participants[1].magic, 560);
    assert.equal(next.participants[0].magic, 600);
  });

  it("捨て札を混ぜると捨て札が空になり、その枚数が山札になる", () => {
    const discarded = frame();
    discarded.participants[1] = {
      ...discarded.participants[1],
      drawPileCount: 0,
      discardPile: [
        { id: "c1", name: "ドラゴン" },
        { id: "c2", name: "ナイト" },
      ],
    };
    const next = applyEvent(
      discarded,
      event("MatchDiscardPileShuffledEvent", { drawPileCount: 2 }),
      BASE,
    );
    assert.deepEqual(next.participants[1].discardPile, []);
    assert.equal(next.participants[1].drawPileCount, 2);
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

  it("手放すと魔力を受け取り、その領地が消えてクリーチャーが捨て札に入る", () => {
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
    assert.deepEqual(next.participants[1].discardPile, [
      { id: "c1", name: "ドラゴン" },
    ]);
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
