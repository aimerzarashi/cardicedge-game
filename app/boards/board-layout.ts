import type { BoardTileAttribute } from "@/graphql/graphql";

// ボードの格子の形（座標は core と同じ 0 始まりの (列, 行)）。studio の app/boards/board-layout.ts から、表示に要るものだけを写した
// （編集の関数 placeTile・removeTile・toggleConnection・pressPairable・isTileKind・isTileAttribute と、つながりの型・関数、印（Mark）は、game では使わないため写していない。
// game の格子はマスとマスの間を描かない）。片方を変えたらもう片方もそろえる

export type Position = { x: number; y: number };
// core の出力（LandTile・BaseTile・CheckpointTile）と同じ形で、種類は __typename で見分ける。属性は土地だけが必ず持つ
export type Placement =
  | { __typename: "LandTile"; attribute: BoardTileAttribute }
  | { __typename: "BaseTile" }
  | { __typename: "CheckpointTile" }
  | { __typename: "WarpTile" }
  | { __typename: "BridgeTile" }
  | { __typename: "SanctuaryTile" }
  | { __typename: "ShrineTile" }
  | { __typename: "ProphecyShopTile" }
  | { __typename: "CardShopTile" };
export type Tile = Position & Placement;
// 転送円どうし・橋どうしの対（向きは無い）。a は core が返す向きのまま（座標が小さい側）
export type Pair = { a: Position; b: Position };
// 対戦で参加者が立っているマスに出す印（game だけ。label は席の番号等の短い文字）
export type Piece = Position & { label: string };

export const TILE_KIND_LABELS: Record<Placement["__typename"], string> = {
  LandTile: "土地",
  BaseTile: "拠点",
  CheckpointTile: "チェックポイント",
  WarpTile: "転送円",
  BridgeTile: "橋",
  SanctuaryTile: "聖堂",
  ShrineTile: "ほこら",
  ProphecyShopTile: "占い館",
  CardShopTile: "カード屋",
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

// 凡例の並び（拠点・チェックポイント・土地 6 つ・転送円・橋・施設 4 つ）。studio の PLACEMENTS と同じ並び
export const PLACEMENTS: Placement[] = [
  { __typename: "BaseTile" },
  { __typename: "CheckpointTile" },
  ...(Object.keys(ATTRIBUTE_LABELS) as BoardTileAttribute[]).map(
    (attribute) => ({ __typename: "LandTile" as const, attribute }),
  ),
  { __typename: "WarpTile" },
  { __typename: "BridgeTile" },
  { __typename: "SanctuaryTile" },
  { __typename: "ShrineTile" },
  { __typename: "ProphecyShopTile" },
  { __typename: "CardShopTile" },
];

export function samePosition(p: Position, q: Position): boolean {
  return p.x === q.x && p.y === q.y;
}

export function tileAt(tiles: Tile[], position: Position): Tile | undefined {
  return tiles.find((tile) => samePosition(tile, position));
}

export type PairableKind = "WarpTile" | "BridgeTile";

export function isPairableKind(
  kind: Placement["__typename"],
): kind is PairableKind {
  return kind === "WarpTile" || kind === "BridgeTile";
}

function pairAt(pairs: Pair[], position: Position): Pair | undefined {
  return pairs.find(
    (pair) => samePosition(pair.a, position) || samePosition(pair.b, position),
  );
}

// 転送円・橋の見分け。番号は、同じ種類の対の中での並び（pairs の順）で 1 から振り、端は a が 1・b が 2（「1-1」「1-2」）。相手のいないものは番号を持たない
export type PairLabel = { number: number; end: 1 | 2 };

export function pairLabel(
  { tiles, pairs }: { tiles: Tile[]; pairs: Pair[] },
  tile: Tile,
): PairLabel | undefined {
  const pair = pairAt(pairs, tile);
  if (!pair) {
    return undefined;
  }
  const number =
    pairs
      .filter((other) => tileAt(tiles, other.a)?.__typename === tile.__typename)
      .indexOf(pair) + 1;
  return { number, end: samePosition(pair.a, tile) ? 1 : 2 };
}
