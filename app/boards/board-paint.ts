import type { CSSProperties } from "react";
import {
  isPairableKind,
  type PairLabel,
  PLACEMENTS,
  type Position,
  type Tile,
  tileLabel,
} from "./board-layout.ts";

// 格子の色・文字・マスの名前。部品（board-grid.tsx）から React を抜いた純粋な関数と定数で、studio の app/boards/board-paint.ts から
// 写したもの（片方を変えたらもう片方もそろえる）。写したあとの違いは、印（Mark）・相手待ち・つながりの印の色（CONNECTED・DISCONNECTED）を持たないことと、
// マスの無い所を描かないため paint がマスの無い場合を受けないこと。
// 部品の中に置かないのは、JSX を含む .tsx は node --test で読めず、単体テストにできないため

// 属性の色。拠点・チェックポイントは属性に使わない色（紫・明るめの桃色）にして、土地と見分ける。
// 枠の模様（二重の枠・斜線）で分ける案は、斜め見下ろしでつぶすと見分けにくいため採らなかった。
// 白は studio のつながりの印に使うので、マスには使わない
const FIRE = "#d9534f";
const EARTH = "#5fae5f";
const WATER = "#4a7fd4";
const WIND = "#c8a24a";
export const LAND_COLORS = {
  FIRE,
  EARTH,
  WATER,
  WIND,
  NEUTRAL: "#9e9e9e",
  // 4 色を 4 つに分けて塗る
  MULTI: `conic-gradient(${FIRE} 0 25%, ${EARTH} 0 50%, ${WATER} 0 75%, ${WIND} 0)`,
};
export const BASE_COLOR = "#8e4ec6";
export const CHECKPOINT_COLOR = "#f7a8c8";
export const WARP_COLOR = "#20b2aa";
export const BRIDGE_COLOR = "#8b5a2b";
export const FACILITY_COLOR = "#3a3f55";
// 施設のマスに書く 1 文字
export const FACILITY_GLYPHS = {
  SanctuaryTile: "聖",
  ShrineTile: "祠",
  ProphecyShopTile: "占",
  CardShopTile: "店",
};
export const BOARD_BACKGROUND = "#1b2440";

// 対戦の参加者の色（席の順。game だけ）。新しい色を増やさず、土地の 4 色を使う（2026-11-08 オーナー）
export const PARTICIPANT_COLORS = [FIRE, WATER, EARTH, WIND];

export function participantColor(seat: number): string {
  return PARTICIPANT_COLORS[seat % PARTICIPANT_COLORS.length];
}

// コマの記号。誰のコマかは色で見せる（2026-11-08 オーナー）。U+FE0E は、端末が絵文字として描くのを防ぎ、文字の色で塗るため
export const PIECE_GLYPH = "\u265F\uFE0E";
// 配置したクリーチャーの記号。コマと同じくチェスの記号にして、持ち主の色で塗る。絵文字は色を変えられないため採らなかった（2026-11-08 オーナー）
export const CREATURE_GLYPH = "\u265E\uFE0E";

// マスの厚み（盤面の座標の px）。マスの間（LINK）より小さくして、隣のマスにかからないようにする
const TILE_THICKNESS = 10;
const VACANT_SIDE_COLOR = "#3a4256";
const TILE_SIDE_SHADE = 3;
const TILE_RADIUS = 7;

// マスを薄い板に見せる側面。領地は持ち主の色、空きは暗い灰色。盤面は rotate(45deg) しているので、右下へずらした影を重ねると画面の真下へ伸びる。
// CSS の 3D 変形にしないのは、格子全体の回転とつぶし（scaleY）の中で奥行きを合わせる手間に対して、見えるのが手前の 2 辺だけのため
export function tileSide(color: string = VACANT_SIDE_COLOR): CSSProperties {
  const sides = Array.from({ length: TILE_THICKNESS }, (_, i) => {
    // 接地する側を暗くして、板が盤面に乗っているように見せる
    const shaded =
      i + 1 > TILE_THICKNESS - TILE_SIDE_SHADE
        ? `color-mix(in srgb, ${color} 60%, black)`
        : color;
    return `${i + 1}px ${i + 1}px 0 ${shaded}`;
  });
  return {
    borderRadius: TILE_RADIUS,
    boxShadow: [`inset 0 0 0 3px rgb(0 0 0 / 0.3)`, ...sides].join(", "),
  };
}

// 凡例は、studio の道具と同じ並びのマスの見本（PLACEMENTS から作る）
export const LEGEND: Tile[] = PLACEMENTS.map((placement) => ({
  x: 0,
  y: 0,
  ...placement,
}));

export function paint(tile: Tile): CSSProperties {
  switch (tile.__typename) {
    case "BaseTile":
      return { border: "1px solid #555", background: BASE_COLOR };
    case "CheckpointTile":
      return { border: "1px solid #555", background: CHECKPOINT_COLOR };
    case "LandTile":
      return {
        border: "1px solid #555",
        background: LAND_COLORS[tile.element],
      };
    case "WarpTile":
      return { border: "1px solid #555", background: WARP_COLOR };
    case "BridgeTile":
      return { border: "1px solid #555", background: BRIDGE_COLOR };
    case "SanctuaryTile":
    case "ShrineTile":
    case "ProphecyShopTile":
    case "CardShopTile":
      return { border: "1px solid #555", background: FACILITY_COLOR };
  }
}

// マスの中に書く文字（特殊なマスだけ）。転送円・橋は対の番号で、相手のいないものは「?」
export function tileText(
  tile: Tile,
  pair: PairLabel | undefined,
): string | undefined {
  switch (tile.__typename) {
    case "WarpTile":
    case "BridgeTile":
      return pair ? `${pair.number}-${pair.end}` : "?";
    case "SanctuaryTile":
    case "ShrineTile":
    case "ProphecyShopTile":
    case "CardShopTile":
      return FACILITY_GLYPHS[tile.__typename];
    default:
      return undefined;
  }
}

// マスの名前（読み上げとテストの手がかり）。種類が付き、転送円・橋には対の番号（なければ「相手なし」）を添える
export function tileName(
  position: Position,
  tile: Tile,
  pair: PairLabel | undefined,
): string {
  const pairName = isPairableKind(tile.__typename)
    ? ` ${pair ? `${pair.number}-${pair.end}` : "相手なし"}`
    : "";
  return `(${position.x}, ${position.y}) のマス ${tileLabel(tile)}${pairName}`;
}
