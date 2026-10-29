import type { BoardTileAttribute } from "@/graphql/graphql";

// ボードの格子の形（座標は core と同じ 0 始まりの (列, 行)）。studio の app/boards/board-layout.ts から、表示に要るものだけを写した
// （編集の関数 placeTile・removeTile・toggleConnection・isTileKind・isTileAttribute と、つながりの型・関数は、game では使わないため写していない。
// game の格子はマスとマスの間を描かない）。片方を変えたらもう片方もそろえる

export type Position = { x: number; y: number };
// core の出力（LandTile・BaseTile・CheckpointTile）と同じ形で、種類は __typename で見分ける。属性は土地だけが必ず持つ
export type Placement =
  | { __typename: "LandTile"; attribute: BoardTileAttribute }
  | { __typename: "BaseTile" }
  | { __typename: "CheckpointTile" };
export type Tile = Position & Placement;
// a は座標が小さい側（行 → 列の順に比べる）。core が返す向きと、画面で作る向きをそろえるため、a と b を入れ替えた同じつながりは作らない
export const TILE_KIND_LABELS: Record<Placement["__typename"], string> = {
  LandTile: "土地",
  BaseTile: "拠点",
  CheckpointTile: "チェックポイント",
};

// 並びは凡例の並び（火・地・水・風・無・複）
export const ATTRIBUTE_LABELS: Record<BoardTileAttribute, string> = {
  FIRE: "火",
  EARTH: "地",
  WATER: "水",
  WIND: "風",
  NEUTRAL: "無",
  MULTI: "複",
};

// 土地は属性つきの名前（「火属性の土地」）で呼ぶ
export function tileLabel(placement: Placement): string {
  return placement.__typename === "LandTile"
    ? `${ATTRIBUTE_LABELS[placement.attribute]}属性の${TILE_KIND_LABELS.LandTile}`
    : TILE_KIND_LABELS[placement.__typename];
}

export function samePosition(p: Position, q: Position): boolean {
  return p.x === q.x && p.y === q.y;
}

export function tileAt(tiles: Tile[], position: Position): Tile | undefined {
  return tiles.find((tile) => samePosition(tile, position));
}
