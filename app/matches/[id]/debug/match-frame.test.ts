import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyEvent,
  battleOnView,
  battleScene,
  eventDurationMs,
  type FrameBattle,
  type FrameBattleSide,
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
    lastingSpellEffect: null,
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

function battleSide(
  name: string,
  attack: number,
  hitPoints: number,
): FrameBattleSide {
  return {
    name,
    item: null,
    initial: { attack, hitPoints },
    modifiers: [],
    states: [],
    damages: [],
    terrainIgnored: false,
    current: { attack, hitPoints },
  };
}

const BATTLE: FrameBattle = {
  attacker: battleSide("ナイト", 40, 20),
  defender: battleSide("ドラゴン", 30, 25),
  firstStriker: null,
  strikes: 0,
  result: null,
  highlight: null,
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

  it("両方が選んだアイテムが侵略の欄に残り、選んだ側に色が付く", () => {
    const attacking = applyEvent(
      frame({ invasion: INVASION, currentParticipant: 1 }),
      event("MatchItemUsedEvent", {
        participant: 1,
        handIndex: 0,
        card: { ...DRAGON, id: "i1", name: "剣" },
        cost: 0,
      }),
      BASE,
    );
    assert.equal(attacking.invasion?.attackerItem, "剣");
    assert.equal(attacking.invasion?.chosenBy, "ATTACKER");
    const defending = applyEvent(
      attacking,
      event("MatchItemSkippedEvent", { participant: 0 }),
      BASE,
    );
    assert.equal(defending.invasion?.defenderItem, null);
    assert.equal(defending.invasion?.chosenBy, "DEFENDER");
  });

  it("戦闘が始まると、両方の名前と出したアイテムと戦闘の前の AT・HP が出る", () => {
    const next = applyEvent(
      frame({
        territories: [TERRITORY],
        invasion: { ...INVASION, attackerItem: "剣", defenderItem: null },
      }),
      event("MatchBattleStartedEvent", {
        attacker: { attack: 40, hitPoints: 20 },
        defender: { attack: 30, hitPoints: 25 },
      }),
      BASE,
    );
    assert.deepEqual(next.battle, {
      ...BATTLE,
      attacker: { ...BATTLE.attacker, item: "剣" },
    });
  });

  it("発動の増減は出どころつきで積み上がり、今の AT・HP は core の値になり、その発動に色が付く", () => {
    const change = (
      attackDelta: number,
      hitPointsDelta: number,
      attack: number,
      hitPoints: number,
    ) => ({ attackDelta, hitPointsDelta, attack, hitPoints });
    let next = frame({ invasion: INVASION, battle: BATTLE });
    for (const activated of [
      event("MatchBattleSupportEffectActivatedEvent", {
        side: "ATTACKER",
        change: change(20, 0, 60, 20),
      }),
      event("MatchBattleItemEffectActivatedEvent", {
        side: "ATTACKER",
        card: { ...DRAGON, id: "i1", name: "剣" },
        activatedEffect: { kind: "ATTACK_MODIFIER", value: 25 },
        change: change(25, 0, 85, 20),
      }),
      event("MatchBattleTerrainEffectActivatedEvent", {
        side: "DEFENDER",
        change: change(0, 10, 30, 35),
      }),
      event("MatchBattleCreatureEffectActivatedEvent", {
        side: "DEFENDER",
        activatedEffect: { kind: "HIT_POINTS_MODIFIER", value: 20 },
        change: change(0, 20, 30, 55),
      }),
      // 支援効果は守る側にも付く（core#178）
      event("MatchBattleSupportEffectActivatedEvent", {
        side: "DEFENDER",
        change: change(10, 0, 40, 55),
      }),
    ]) {
      next = applyEvent(next, activated, BASE);
    }
    assert.deepEqual(next.battle?.attacker.modifiers, [
      { source: { kind: "support" }, attackDelta: 20, hitPointsDelta: 0 },
      {
        source: { kind: "item", name: "剣", effect: "ATTACK_MODIFIER" },
        attackDelta: 25,
        hitPointsDelta: 0,
      },
    ]);
    assert.deepEqual(next.battle?.defender.modifiers, [
      { source: { kind: "terrain" }, attackDelta: 0, hitPointsDelta: 10 },
      {
        source: { kind: "creature", effect: "HIT_POINTS_MODIFIER" },
        attackDelta: 0,
        hitPointsDelta: 20,
      },
      { source: { kind: "support" }, attackDelta: 10, hitPointsDelta: 0 },
    ]);
    assert.deepEqual(next.battle?.attacker.current, {
      attack: 85,
      hitPoints: 20,
    });
    assert.deepEqual(next.battle?.defender.current, {
      attack: 40,
      hitPoints: 55,
    });
    assert.deepEqual(next.battle?.highlight, {
      side: "DEFENDER",
      part: "modifier",
      index: 2,
    });
  });

  it("地形効果を無視するは、相手の地形効果の分を数えなくなった印を立て、相手の今の値を core の値にし、その印に色が付く", () => {
    const terrained = applyEvent(
      frame({ invasion: INVASION, battle: BATTLE }),
      event("MatchBattleTerrainEffectActivatedEvent", {
        side: "DEFENDER",
        change: {
          attackDelta: 0,
          hitPointsDelta: 20,
          attack: 30,
          hitPoints: 45,
        },
      }),
      BASE,
    );
    const next = applyEvent(
      terrained,
      event("MatchBattleItemEffectActivatedEvent", {
        side: "ATTACKER",
        card: { ...DRAGON, id: "i2", name: "巻物" },
        activatedEffect: { kind: "IGNORE_TERRAIN_EFFECT" },
        change: null,
        opponentChange: {
          attackDelta: 0,
          hitPointsDelta: -20,
          attack: 30,
          hitPoints: 25,
        },
      }),
      BASE,
    );
    assert.equal(next.battle?.defender.terrainIgnored, true);
    assert.deepEqual(next.battle?.defender.current, {
      attack: 30,
      hitPoints: 25,
    });
    assert.deepEqual(next.battle?.attacker, terrained.battle?.attacker);
    assert.deepEqual(next.battle?.highlight, {
      side: "DEFENDER",
      part: "terrainIgnored",
    });
  });

  it("AT・HP を変えないクリーチャーの効果の発動は、得た状態に入り、増減は変えない", () => {
    const next = applyEvent(
      frame({ invasion: INVASION, battle: BATTLE }),
      event("MatchBattleCreatureEffectActivatedEvent", {
        side: "DEFENDER",
        activatedEffect: { kind: "STRIKE_FIRST" },
        change: null,
      }),
      BASE,
    );
    assert.deepEqual(next.battle?.defender.states, ["STRIKE_FIRST"]);
    assert.deepEqual(next.battle?.defender.modifiers, []);
    assert.deepEqual(next.battle?.highlight, {
      side: "DEFENDER",
      part: "state",
      index: 0,
    });
  });

  it("攻撃は受けた側のダメージと今の HP を変え、先に攻撃した側と回数が残り、領地のクリーチャーの体力は変えない", () => {
    const start = frame({
      territories: [TERRITORY],
      invasion: INVASION,
      battle: BATTLE,
    });
    const struck = applyEvent(
      start,
      event("MatchCreatureStruckEvent", {
        striker: "ATTACKER",
        damage: 20,
        remainingHitPoints: 5,
      }),
      BASE,
    );
    assert.deepEqual(struck.battle?.defender.damages, [20]);
    assert.equal(struck.battle?.defender.current.hitPoints, 5);
    assert.equal(struck.battle?.attacker.current.hitPoints, 20);
    assert.equal(struck.battle?.firstStriker, "ATTACKER");
    assert.deepEqual(struck.battle?.highlight, {
      side: "DEFENDER",
      part: "damage",
      index: 0,
    });
    const countered = applyEvent(
      struck,
      event("MatchCreatureStruckEvent", {
        striker: "DEFENDER",
        damage: 8,
        remainingHitPoints: 12,
      }),
      BASE,
    );
    assert.equal(countered.battle?.attacker.current.hitPoints, 12);
    assert.equal(countered.battle?.firstStriker, "ATTACKER");
    assert.equal(countered.battle?.strikes, 2);
    assert.equal(countered.territories[0].creature.hitPoints, 20);
  });

  it("戦闘以外のイベントでは、直前の発動の色が消える", () => {
    const next = applyEvent(
      frame({
        invasion: INVASION,
        battle: { ...BATTLE, highlight: { part: "result" } },
      }),
      event("MatchTollPaidEvent", { participant: 1, owner: 0, magic: 0 }),
      BASE,
    );
    assert.equal(next.battle?.highlight, null);
  });

  it("シーンは、攻める側のアイテム選択 → 守る側のアイテム選択 → 先攻 → 後攻 → 結果と進む", () => {
    assert.equal(battleScene(frame()), null);
    assert.equal(
      battleScene(frame({ invasion: INVASION, phase: "ATTACKING" })),
      "attackerItem",
    );
    assert.equal(
      battleScene(frame({ invasion: INVASION, phase: "DEFENDING" })),
      "defenderItem",
    );
    assert.equal(
      battleScene(frame({ invasion: INVASION, battle: BATTLE })),
      "firstStrike",
    );
    assert.equal(
      battleScene(
        frame({ invasion: INVASION, battle: { ...BATTLE, strikes: 1 } }),
      ),
      "secondStrike",
    );
    assert.equal(
      battleScene(frame({ battle: { ...BATTLE, result: "repelled" } })),
      "result",
    );
  });

  it("戦闘の結果は次の侵略が始まるまで残る", () => {
    const ended = applyEvent(
      frame({ battle: { ...BATTLE, result: "repelled" } }),
      event("MatchTurnEndedEvent", { participant: 0 }),
      BASE,
    );
    assert.equal(ended.battle?.result, "repelled");
    const next = applyEvent(
      ended,
      event("MatchTerritoryInvadedEvent", {
        participant: 0,
        card: INVASION.card,
        handIndex: 0,
        position: INVASION.position,
        cost: 0,
      }),
      BASE,
    );
    assert.equal(next.battle, null);
  });

  it("守るクリーチャーが破壊されると持ち主の捨て札に入って土地が空き、侵略に成功すると攻めたクリーチャーがレベルを引き継いで入り、侵略の欄が消える", () => {
    const destroyed = applyEvent(
      frame({
        territories: [{ ...TERRITORY, owner: 0, level: 2 }],
        invasion: INVASION,
        battle: BATTLE,
      }),
      event("MatchDefendingCreatureDestroyedEvent", {
        position: INVASION.position,
      }),
      BASE,
    );
    assert.deepEqual(destroyed.territories, []);
    const next = applyEvent(
      destroyed,
      event("MatchInvasionSucceededEvent", {
        position: INVASION.position,
        creature: 7,
        territoryHitPoints: 8,
      }),
      BASE,
    );
    assert.equal(next.invasion, null);
    assert.equal(next.battle?.result, "conquered");
    assert.deepEqual(next.battle?.highlight, { part: "result" });
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
      event("MatchInvasionFailedEvent", {
        card: INVASION.card,
        position: INVASION.position,
        returnedToHand: true,
        territoryHitPoints: 9,
      }),
      BASE,
    );
    assert.equal(next.battle?.result, "repelled");
    assert.equal(next.territories[0].creature.hitPoints, 9);
  });

  it("侵略に失敗して生きていれば手札の最後に戻り、侵略したクリーチャーが破壊されていれば捨て札に入る", () => {
    const returned = applyEvent(
      frame({ invasion: INVASION }),
      event("MatchInvasionFailedEvent", {
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
      applyEvent(
        frame({ invasion: INVASION }),
        event("MatchInvadingCreatureDestroyedEvent", {
          card: INVASION.card,
          position: INVASION.position,
        }),
        BASE,
      ),
      event("MatchInvasionFailedEvent", {
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
      event("MatchLandLeveledUpEvent", {
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
      event("MatchCreaturePlacedEvent", {
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
      event("MatchLandLeveledUpEvent", {
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
      applyEvent(
        invaded,
        event("MatchDefendingCreatureDestroyedEvent", {
          position: other.position,
        }),
        BASE,
      ),
      event("MatchInvasionSucceededEvent", {
        position: other.position,
        creature: 1,
        territoryHitPoints: 18,
      }),
      BASE,
    );
    assert.equal(conquered.invasion, null);
    // 価値と通行料は、続けて当てる changes の値で決まる
    assert.deepEqual(conquered.territories, [
      {
        position: other.position,
        owner: 1,
        level: other.level,
        value: 0,
        toll: 0,
        creature: { ...own.creature, hitPoints: 18 },
      },
    ]);
  });

  it("移動で侵略して生き残ると元の領地に戻り、侵略したクリーチャーが破壊されると元の土地が空いて捨て札に入る", () => {
    const own = { ...TERRITORY, owner: 1 };
    const invasion = {
      ...INVASION,
      position: { x: 2, y: 0 },
      from: own.position,
    };
    const returned = applyEvent(
      frame({ territories: [own], invasion }),
      event("MatchInvasionFailedEvent", {
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
      applyEvent(
        frame({ territories: [own], invasion }),
        event("MatchInvadingCreatureDestroyedEvent", {
          card: INVASION.card,
          position: { x: 2, y: 0 },
        }),
        BASE,
      ),
      event("MatchInvasionFailedEvent", {
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
    applyEvent(
      before,
      event("MatchPieceMovedEvent", { to: { x: 1, y: 0 } }),
      BASE,
    );
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

  it("ターンをまたいで効き続ける効果がかかると対象に付き、対象がターンを終えると 1 減り、終わったイベントで消える", () => {
    const effect = { __typename: "FixedDiceSpellEffect", value: 6, turns: 2 };
    const cast = applyEvent(
      frame(),
      event("MatchSpellEffectStartedEvent", {
        target: 0,
        effect: { remainingTurns: 2, effect },
      }),
      BASE,
    );
    assert.deepEqual(cast.participants[0].lastingSpellEffect, {
      effect,
      remainingTurns: 2,
    });
    assert.equal(cast.participants[1].lastingSpellEffect, null);
    const passed = applyEvent(
      { ...cast, currentParticipant: 0 },
      event("MatchTurnEndedEvent", { participant: 0 }),
      BASE,
    );
    assert.equal(passed.participants[0].lastingSpellEffect?.remainingTurns, 1);
    const removed = applyEvent(
      passed,
      event("MatchSpellEffectEndedEvent", { participant: 0 }),
      BASE,
    );
    assert.equal(removed.participants[0].lastingSpellEffect, null);
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
      event("MatchBoardCreatureDestroyedEvent", {
        position: { x: 1, y: 0 },
      }),
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

  it("破壊されたら魔力を得るの結果は、今の番の人でなく持ち主の魔力に入る", () => {
    const next = applyEvent(
      frame(),
      event("MatchMagicReceivedEvent", { owner: 0, magic: 200 }),
      BASE,
    );
    assert.equal(next.participants[0].magic, 800);
    assert.equal(next.participants[1].magic, 600);
  });

  it("破壊されて手札に戻ると、持ち主の捨て札の最後から手札の最後へ移る", () => {
    const before = frame();
    before.participants[0] = {
      ...before.participants[0],
      discardPile: [{ id: DRAGON.id, name: DRAGON.name }],
    };
    const next = applyEvent(
      before,
      event("MatchCardReturnedToHandEvent", { owner: 0, card: DRAGON }),
      BASE,
    );
    assert.deepEqual(next.participants[0].discardPile, []);
    assert.deepEqual(next.participants[0].hand.at(-1), DRAGON);
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
      event("MatchPieceMovedEvent", { to: { x: 1, y: 0 } }, null),
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
        ...event("MatchCreaturePlacedEvent", {
          handIndex: 0,
          card: DRAGON,
          creature: 1,
          position: { x: 1, y: 0 },
          cost: 30,
        }),
        changes: {
          phase: ENDING,
          totalMagics: [{ participant: 1, totalMagic: 670 }],
          territoryValues: [
            {
              position: { x: 1, y: 0 },
              value: 100,
              toll: 60,
              level: 1,
              chainCount: 1,
            },
          ],
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
          territoryValues: [
            {
              position: { x: 1, y: 0 },
              value: 150,
              toll: 90,
              level: 1,
              chainCount: 2,
            },
          ],
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
      event("MatchPieceMovedEvent", { to: BASE }),
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
    assert.equal(eventDurationMs(event("MatchDrawPilesShuffledEvent")), 0);
  });

  it("画面に映るイベントは待つ", () => {
    assert.ok(eventDurationMs(event("MatchPieceMovedEvent")) > 0);
  });
});

describe("battleOnView", () => {
  it("戦闘が始まる前も、侵略したクリーチャーと領地のクリーチャーを、まだ選んでいないアイテムと今の値で出す", () => {
    const view = battleOnView(
      frame({ territories: [TERRITORY], invasion: INVASION, battle: null }),
    );
    assert.equal(view?.attacker.name, "ナイト");
    assert.equal(view?.attacker.item, undefined);
    assert.deepEqual(view?.attacker.current, { attack: 40, hitPoints: 20 });
    assert.equal(view?.defender.name, "ドラゴン");
    assert.deepEqual(view?.defender.current, { attack: 30, hitPoints: 20 });
    assert.equal(view?.highlight, null);
  });

  it("アイテムを選んだら、選んだ側のアイテムに色が付く", () => {
    const view = battleOnView(
      frame({
        territories: [TERRITORY],
        invasion: { ...INVASION, attackerItem: "剣", chosenBy: "ATTACKER" },
        battle: null,
      }),
    );
    assert.equal(view?.attacker.item, "剣");
    assert.deepEqual(view?.highlight, { side: "ATTACKER", part: "item" });
  });

  it("戦闘が始まったら、戦闘の中の値をそのまま出し、侵略が無ければ出さない", () => {
    const started = frame({ invasion: INVASION, battle: BATTLE });
    assert.equal(battleOnView(started), BATTLE);
    assert.equal(battleOnView(frame({ invasion: null, battle: null })), null);
  });
});
