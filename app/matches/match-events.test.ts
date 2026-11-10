import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  eventLine,
  type MatchEventView,
  mergeShown,
  splitEvents,
} from "./match-events.ts";

const names = ["部屋用", "ゴリガン"];
const event = (
  revision: number,
  rest: Partial<MatchEventView> = {},
): MatchEventView => ({
  __typename: "MatchMovedEvent",
  revision,
  ...rest,
});

describe("eventLine", () => {
  it("領地のレベルを上げたイベントは、位置・レベル・払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(30, {
          __typename: "MatchTerritoryLeveledUpEvent",
          participant: 0,
          position: { x: 2, y: 0 },
          level: 3,
          magic: 300,
        }),
        names,
      ),
      "版 30 部屋用: 領地 (2, 0) をレベル 3 に上げた（魔力 -300）",
    );
  });

  it("土地の属性を変えたイベントは、位置・属性・払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(33, {
          __typename: "MatchLandElementChangedEvent",
          participant: 0,
          position: { x: 1, y: 0 },
          element: "WATER",
          magic: 200,
        }),
        names,
      ),
      "版 33 部屋用: 領地 (1, 0) の土地を水属性に変えた（魔力 -200）",
    );
  });

  it("動かしたイベントと、移動で侵略したイベントを出す", () => {
    assert.equal(
      eventLine(
        event(34, {
          __typename: "MatchCreatureMovedEvent",
          participant: 0,
          from: { x: 1, y: 0 },
          to: { x: 2, y: 0 },
        }),
        names,
      ),
      "版 34 部屋用: (1, 0) のクリーチャーを (2, 0) へ動かした",
    );
    assert.equal(
      eventLine(
        event(35, {
          __typename: "MatchTerritoryInvadedByMoveEvent",
          participant: 0,
          from: { x: 1, y: 0 },
          position: { x: 2, y: 0 },
        }),
        names,
      ),
      "版 35 部屋用: (1, 0) のクリーチャーを動かして (2, 0) を侵略した",
    );
  });

  it("移動で侵略して失敗したイベントは、元の領地に戻ったか倒れたかを出す", () => {
    const repelled = (returnedTo: { x: number; y: number } | null) =>
      eventLine(
        event(36, {
          __typename: "MatchInvasionRepelledEvent",
          participant: 0,
          card: { name: "ナイト" },
          returnedToHand: false,
          returnedTo,
        }),
        names,
      );
    assert.equal(
      repelled({ x: 1, y: 0 }),
      "版 36 部屋用: 侵略に失敗した（「ナイト」は元の領地に戻った）",
    );
    assert.equal(
      repelled(null),
      "版 36 部屋用: 侵略に失敗した（「ナイト」は捨て札になった）",
    );
  });

  it("交換したイベントは、位置・元のカード・出したカード・払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(32, {
          __typename: "MatchCreatureExchangedEvent",
          participant: 0,
          position: { x: 1, y: 0 },
          card: { name: "ナイト" },
          returnedCard: { name: "ゴブリン" },
          cost: 40,
        }),
        names,
      ),
      "版 32 部屋用: 領地 (1, 0) の「ゴブリン」を「ナイト」に交換した（魔力 -40）",
    );
  });

  it("戦闘の始まりは、両方の効果を当てる前の AT・HP を出す", () => {
    assert.equal(
      eventLine(
        event(20, {
          __typename: "MatchBattleStartedEvent",
          attacker: { attack: 30, hitPoints: 40 },
          defender: { attack: 20, hitPoints: 35 },
        }),
        names,
      ),
      "版 20 戦闘が始まった（攻める側 AT 30・HP 40、守る側 AT 20・HP 35）",
    );
  });

  for (const [name, source, side, change, delta, stats] of [
    [
      "支援",
      {
        __typename: "MatchAdjacentTerritoriesSource",
        positions: [
          { x: 1, y: 0 },
          { x: 3, y: 0 },
        ],
      },
      "ATTACKER",
      "攻める側に支援（隣の領地 2 つ）: AT +20 → AT 50・HP 40",
      { attackDelta: 20, hitPointsDelta: 0 },
      { attack: 50, hitPoints: 40 },
    ],
    [
      "地形効果",
      { __typename: "MatchTerrainSource", element: "FIRE", level: 2 },
      "DEFENDER",
      "守る側に地形効果（火属性 レベル 2）: HP +20 → AT 20・HP 60",
      { attackDelta: 0, hitPointsDelta: 20 },
      { attack: 20, hitPoints: 60 },
    ],
    [
      "アイテムで HP が 0",
      { __typename: "MatchItemSource", card: { name: "呪いの指輪" } },
      "ATTACKER",
      "攻める側にアイテム「呪いの指輪」: HP -40 → AT 30・HP 0（破壊された）",
      { attackDelta: 0, hitPointsDelta: -40 },
      { attack: 30, hitPoints: 0 },
    ],
  ] as const) {
    it(`効果のイベントは、${name}の増減と当てた後の値を出す`, () => {
      assert.equal(
        eventLine(
          event(21, {
            __typename: "MatchBattleStatModifiedEvent",
            side,
            source: source as MatchEventView["source"],
            ...delta,
            ...stats,
          }),
          names,
        ),
        `版 21 ${change}`,
      );
    });
  }

  it("進んだイベントは、版・アバターの名前・行き先を出す", () => {
    assert.equal(
      eventLine(event(15, { participant: 1, to: { x: 1, y: 0 } }), names),
      "版 15 ゴリガン: (1, 0) へ進んだ",
    );
  });

  it("配置したイベントは、クリーチャーの名前・位置・払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(17, {
          __typename: "MatchCreatureDeployedEvent",
          participant: 0,
          card: { name: "ウルフ" },
          position: { x: 1, y: 0 },
          cost: 10,
        }),
        names,
      ),
      "版 17 部屋用: クリーチャー「ウルフ」を (1, 0) に配置した（魔力 -10）",
    );
  });

  it("スペルを使ったイベントは、スペルの名前と払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(18, {
          __typename: "MatchSpellUsedEvent",
          participant: 0,
          card: { name: "ホープ" },
          cost: 40,
        }),
        names,
      ),
      "版 18 部屋用: スペル「ホープ」を使った（魔力 -40）",
    );
  });

  it("通行料は、受け取った人の名前・位置・払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(18, {
          __typename: "MatchTollPaidEvent",
          participant: 0,
          owner: 1,
          position: { x: 1, y: 0 },
          magic: 60,
        }),
        names,
      ),
      "版 18 部屋用: ゴリガンの領地 (1, 0) に通行料を払った（魔力 -60）",
    );
  });

  it("領地を手放したイベントは、位置と受け取った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(19, {
          __typename: "MatchTerritoryRelinquishedEvent",
          participant: 0,
          position: { x: 2, y: 0 },
          magic: 80,
        }),
        names,
      ),
      "版 19 部屋用: 領地 (2, 0) を手放した（魔力 +80）",
    );
  });

  it("魔力の枯渇は、与えられた魔力を出す", () => {
    assert.equal(
      eventLine(
        event(20, {
          __typename: "MatchMagicDepletedEvent",
          participant: 0,
          magic: 600,
        }),
        names,
      ),
      "版 20 部屋用: 魔力が枯渇し、拠点からやり直す（魔力 600）",
    );
  });

  it("チェックポイントは位置と増えた魔力を出す", () => {
    assert.equal(
      eventLine(
        event(16, {
          __typename: "MatchCheckpointPassedEvent",
          participant: 1,
          checkpoint: { x: 2, y: 2 },
          magic: 100,
        }),
        names,
      ),
      "版 16 ゴリガン: チェックポイント (2, 2) を通った（魔力 +100）",
    );
  });

  it("サイコロの目を出す", () => {
    assert.equal(
      eventLine(
        event(12, {
          __typename: "MatchDiceRolledEvent",
          participant: 0,
          value: 3,
        }),
        names,
      ),
      "版 12 部屋用: サイコロ 3",
    );
  });

  it("誰も起こしていないイベントは、名前を付けない", () => {
    assert.equal(
      eventLine(event(1, { __typename: "MatchCreatedEvent" }), names),
      "版 1 対戦が始まった",
    );
  });

  it("順番と勝った人は、参加者の番号を名前にして出す", () => {
    assert.equal(
      eventLine(
        event(2, { __typename: "MatchTurnOrderDecidedEvent", order: [1, 0] }),
        names,
      ),
      "版 2 順番が決まった: ゴリガン → 部屋用",
    );
    assert.equal(
      eventLine(
        event(40, {
          __typename: "MatchEndedEvent",
          winners: [0, 1],
          reason: "ROUND_LIMIT",
        }),
        names,
      ),
      "版 40 対戦が終わった（勝った人: 部屋用、ゴリガン。ラウンドの上限に達した）",
    );
  });

  it("戦利品のイベントは、引いたカードの名前と、全員が受け取ったことを出す", () => {
    assert.equal(
      eventLine(
        event(41, {
          __typename: "MatchRewardDrawnEvent",
          participant: 0,
          rewardCards: [{ name: "A" }, { name: "B" }],
        }),
        names,
      ),
      "版 41 部屋用: 戦利品を引いた（A、B）",
    );
    assert.equal(
      eventLine(event(42, { __typename: "MatchRewardsCompletedEvent" }), names),
      "版 42 全員が戦利品を受け取った",
    );
  });

  it("知らない種類でも落とさずに 1 行を出す", () => {
    assert.match(
      eventLine(event(3, { __typename: "MatchFutureEvent" }), names),
      /^版 3 /,
    );
  });
});

describe("splitEvents", () => {
  it("開いた時点の版までは欄に入れるだけ、それより後を順に描画する", () => {
    const events = [event(3), event(4), event(5)];
    const { silent, play } = splitEvents(events, 4);
    assert.deepEqual(
      silent.map((e) => e.revision),
      [3, 4],
    );
    assert.deepEqual(
      play.map((e) => e.revision),
      [5],
    );
  });
});

describe("mergeShown", () => {
  it("同じ版のイベントは 1 つだけにする", () => {
    const merged = mergeShown([event(1), event(2)], [event(2), event(3)]);
    assert.deepEqual(
      merged.map((e) => e.revision),
      [1, 2, 3],
    );
  });
});
