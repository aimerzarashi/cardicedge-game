import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type Pair,
  PLACEMENTS,
  type Placement,
  type Position,
  pairLabel,
  type Tile,
  tileAt,
  tileLabel,
} from "./board-layout.ts";

const fire: Placement = { __typename: "LandTile", attribute: "FIRE" };
const warp: Placement = { __typename: "WarpTile" };
const bridge: Placement = { __typename: "BridgeTile" };

const at = (x: number, y: number): Position => ({ x, y });
const tilesOf = (placement: Placement, ...positions: Position[]): Tile[] =>
  positions.map((position) => ({ ...position, ...placement }));

describe("PLACEMENTS（道具・凡例の並び）", () => {
  it("拠点・チェックポイント・土地 6 つ・転送円・橋・施設 4 つの順に並ぶ", () => {
    assert.deepEqual(PLACEMENTS.map(tileLabel), [
      "拠点",
      "チェックポイント",
      "火属性の土地",
      "地属性の土地",
      "水属性の土地",
      "風属性の土地",
      "無属性の土地",
      "複属性の土地",
      "転送円",
      "橋",
      "聖堂",
      "ほこら",
      "占い館",
      "カード屋",
    ]);
  });
});

describe("pairLabel（転送円・橋の番号）", () => {
  it("転送円と橋で別に、対ごとに 1 から振り、端は a が 1・b が 2", () => {
    const tiles = [
      ...tilesOf(warp, at(0, 0), at(2, 0), at(4, 0), at(6, 0)),
      ...tilesOf(bridge, at(0, 2), at(2, 2)),
    ];
    const pairs: Pair[] = [
      { a: at(0, 0), b: at(2, 0) },
      { a: at(4, 0), b: at(6, 0) },
      { a: at(0, 2), b: at(2, 2) },
    ];

    const label = (x: number, y: number) => {
      const tile = tileAt(tiles, at(x, y));
      if (!tile) {
        throw new Error(`(${x}, ${y}) にマスがありません`);
      }
      return pairLabel({ tiles, pairs }, tile);
    };

    assert.deepEqual(label(0, 0), { number: 1, end: 1 });
    assert.deepEqual(label(2, 0), { number: 1, end: 2 });
    assert.deepEqual(label(4, 0), { number: 2, end: 1 });
    assert.deepEqual(label(6, 0), { number: 2, end: 2 });
    assert.deepEqual(label(0, 2), { number: 1, end: 1 });
    assert.deepEqual(label(2, 2), { number: 1, end: 2 });
  });

  it("番号は pairs の並びで振り、座標では並べ替えない", () => {
    const tiles = tilesOf(warp, at(0, 0), at(2, 0), at(4, 0), at(6, 0));
    const pairs = [
      { a: at(4, 0), b: at(6, 0) },
      { a: at(0, 0), b: at(2, 0) },
    ];

    assert.deepEqual(pairLabel({ tiles, pairs }, tiles[0]), {
      number: 2,
      end: 1,
    });
    assert.deepEqual(pairLabel({ tiles, pairs }, tiles[2]), {
      number: 1,
      end: 1,
    });
  });

  it("相手のいないものは番号を持たない", () => {
    const tiles = tilesOf(warp, at(0, 0));

    assert.equal(pairLabel({ tiles, pairs: [] }, tiles[0]), undefined);
  });
});

describe("tileLabel", () => {
  it("土地は属性つきの名前で呼ぶ", () => {
    assert.equal(tileLabel(fire), "火属性の土地");
    assert.equal(tileLabel(bridge), "橋");
  });
});
