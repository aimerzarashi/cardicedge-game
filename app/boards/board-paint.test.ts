import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PairLabel, Placement, Tile } from "./board-layout.ts";
import {
  BASE_COLOR,
  BRIDGE_COLOR,
  CHECKPOINT_COLOR,
  FACILITY_COLOR,
  FACILITY_GLYPHS,
  LAND_COLORS,
  LEGEND,
  paint,
  tileName,
  tileText,
  WARP_COLOR,
} from "./board-paint.ts";

const tile = (placement: Placement, x = 0, y = 0): Tile => ({
  x,
  y,
  ...placement,
});
const land = (
  attribute: "FIRE" | "EARTH" | "WATER" | "WIND" | "NEUTRAL" | "MULTI",
) => tile({ __typename: "LandTile", attribute });
const pair = (number: number, end: 1 | 2): PairLabel => ({ number, end });

describe("paint（マスの色）", () => {
  it("土地は属性ごとの色で塗る", () => {
    assert.equal(paint(land("EARTH")).background, LAND_COLORS.EARTH);
    assert.equal(paint(land("WIND")).background, LAND_COLORS.WIND);
    assert.equal(paint(land("FIRE")).background, LAND_COLORS.FIRE);
  });

  it("複属性は 4 色を 4 つに分けて塗る", () => {
    assert.match(
      String(paint(land("MULTI")).background),
      /^conic-gradient\(.*25%.*50%.*75%/,
    );
  });

  it("拠点・チェックポイント・転送円・橋は、それぞれの色で塗る", () => {
    assert.equal(
      paint(tile({ __typename: "BaseTile" })).background,
      BASE_COLOR,
    );
    assert.equal(
      paint(tile({ __typename: "CheckpointTile" })).background,
      CHECKPOINT_COLOR,
    );
    assert.equal(
      paint(tile({ __typename: "WarpTile" })).background,
      WARP_COLOR,
    );
    assert.equal(
      paint(tile({ __typename: "BridgeTile" })).background,
      BRIDGE_COLOR,
    );
  });

  it("施設 4 つは共通の色で塗る", () => {
    for (const kind of Object.keys(
      FACILITY_GLYPHS,
    ) as (keyof typeof FACILITY_GLYPHS)[]) {
      assert.equal(
        paint(tile({ __typename: kind })).background,
        FACILITY_COLOR,
      );
    }
  });

  it("属性・種類の色はどれも違う（見分けがつく）", () => {
    const colors = [
      ...Object.values(LAND_COLORS),
      BASE_COLOR,
      CHECKPOINT_COLOR,
      WARP_COLOR,
      BRIDGE_COLOR,
      FACILITY_COLOR,
    ];

    assert.equal(new Set(colors).size, colors.length);
  });
});

describe("tileText（マスの中の文字）", () => {
  it("施設は 1 文字（聖・祠・占・店）", () => {
    assert.equal(
      tileText(tile({ __typename: "SanctuaryTile" }), undefined),
      "聖",
    );
    assert.equal(tileText(tile({ __typename: "ShrineTile" }), undefined), "祠");
    assert.equal(
      tileText(tile({ __typename: "ProphecyShopTile" }), undefined),
      "占",
    );
    assert.equal(
      tileText(tile({ __typename: "CardShopTile" }), undefined),
      "店",
    );
  });

  it("転送円・橋は対の番号「1-1」「1-2」、相手のいないものは「?」", () => {
    const warp = tile({ __typename: "WarpTile" });
    const bridge = tile({ __typename: "BridgeTile" });

    assert.equal(tileText(warp, pair(1, 1)), "1-1");
    assert.equal(tileText(bridge, pair(2, 2)), "2-2");
    assert.equal(tileText(warp, undefined), "?");
    assert.equal(tileText(bridge, undefined), "?");
  });

  it("土地・拠点・チェックポイントには文字を書かない", () => {
    assert.equal(tileText(land("FIRE"), undefined), undefined);
    assert.equal(
      tileText(tile({ __typename: "BaseTile" }), undefined),
      undefined,
    );
    assert.equal(
      tileText(tile({ __typename: "CheckpointTile" }), undefined),
      undefined,
    );
  });
});

describe("LEGEND", () => {
  it("studio の道具と同じ 14 個", () => {
    assert.equal(LEGEND.length, 14);
  });
});

describe("tileName（マスの名前）", () => {
  const origin = { x: 2, y: 0 };

  it("座標と種類が付く", () => {
    assert.equal(
      tileName(origin, tile({ __typename: "BaseTile" }), undefined),
      "(2, 0) のマス 拠点",
    );
  });

  it("土地は属性つきの名前になる", () => {
    assert.equal(
      tileName({ x: 1, y: 0 }, land("FIRE"), undefined),
      "(1, 0) のマス 火属性の土地",
    );
  });

  it("施設は種類の名前になる", () => {
    assert.equal(
      tileName(origin, tile({ __typename: "SanctuaryTile" }), undefined),
      "(2, 0) のマス 聖堂",
    );
  });

  it("対になっている転送円・橋には番号が付く", () => {
    assert.equal(
      tileName(origin, tile({ __typename: "WarpTile" }), pair(1, 1)),
      "(2, 0) のマス 転送円 1-1",
    );
    assert.equal(
      tileName(origin, tile({ __typename: "BridgeTile" }), pair(2, 2)),
      "(2, 0) のマス 橋 2-2",
    );
  });

  it("相手のいない転送円・橋は「相手なし」", () => {
    assert.equal(
      tileName(origin, tile({ __typename: "WarpTile" }), undefined),
      "(2, 0) のマス 転送円 相手なし",
    );
    assert.equal(
      tileName(origin, tile({ __typename: "BridgeTile" }), undefined),
      "(2, 0) のマス 橋 相手なし",
    );
  });

  it("転送円・橋以外には番号が付かない", () => {
    assert.equal(
      tileName(origin, land("FIRE"), pair(1, 1)),
      "(2, 0) のマス 火属性の土地",
    );
  });
});
