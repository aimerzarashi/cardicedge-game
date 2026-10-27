import type { BoardTileKind } from "@/graphql/graphql";

// ボードの格子の形（座標は core と同じ 0 始まりの (列, 行)）。studio の app/boards/board-layout.ts から、表示に要るものだけを写した
// （編集の関数 placeTile・removeTile・toggleConnection・isTileKind は game では使わないため写していない）。片方を変えたらもう片方もそろえる

export type Position = { x: number; y: number };
export type Tile = Position & { kind: BoardTileKind };
// a は座標が小さい側（行 → 列の順に比べる）。core が返す向きと、画面で作る向きをそろえるため、a と b を入れ替えた同じつながりは作らない
export type Connection = { a: Position; b: Position };

export const TILE_KIND_LABELS: Record<BoardTileKind, string> = {
  LAND: "土地",
  BASE: "拠点",
  CHECKPOINT: "チェックポイント",
};

export function samePosition(p: Position, q: Position): boolean {
  return p.x === q.x && p.y === q.y;
}

export function sameConnection(c: Connection, d: Connection): boolean {
  return samePosition(c.a, d.a) && samePosition(c.b, d.b);
}

export function tileAt(tiles: Tile[], position: Position): Tile | undefined {
  return tiles.find((tile) => samePosition(tile, position));
}

export function connectionBetween(p: Position, q: Position): Connection {
  return p.y < q.y || (p.y === q.y && p.x < q.x)
    ? { a: p, b: q }
    : { a: q, b: p };
}

export function hasConnection(
  connections: Connection[],
  connection: Connection,
): boolean {
  return connections.some((c) => sameConnection(c, connection));
}
