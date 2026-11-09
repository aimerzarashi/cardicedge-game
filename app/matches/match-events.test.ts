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
