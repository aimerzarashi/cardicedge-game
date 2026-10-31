// 格子の表示の計算（大きさ・収め方・拡大縮小）。部品（board-grid.tsx）から React を抜いた純粋な関数で、studio の app/boards/board-view.ts から
// 写したもの（片方を変えたらもう片方もそろえる）。写したあとの違いは、マスの中心を枠の中央へ動かす centerOn を持たないこと（編集で使うもので、game では使わない）。
// 部品の中に置かないのは、JSX を含む .tsx は node --test で読めず、単体テストにできないため

// マスの一辺とつながりの幅（px）。回す前の grid の大きさの計算にも使う
export const TILE = 48;
export const LINK = 20;

// 拡大の上限・下限は表示の都合の値で、core の決まりではない（ボードの大きさの範囲は core の studioRules.board）
export const MIN_SCALE = 0.05;
export const MAX_SCALE = 4;
export const ZOOM_STEP = 1.25;

export type View = { scale: number; x: number; y: number };
export type Size = { width: number; height: number };

export const clamp = (scale: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

export function span(count: number): number {
  return count * TILE + (count - 1) * LINK;
}

// grid の左上を原点に回すと、横は −gridH/√2 〜 gridW/√2、縦は 0 〜 (gridW+gridH)/(2√2) に広がる。その全体を枠の中央に収める
export function fitView(size: Size, width: number, height: number): View {
  const gridW = span(width);
  const gridH = span(height);
  const boundsW = (gridW + gridH) / Math.SQRT2;
  const boundsH = boundsW / 2;
  const scale = clamp(
    Math.min(size.width / boundsW, size.height / boundsH) * 0.95,
  );
  return {
    scale,
    x: (size.width - scale * boundsW) / 2 + (scale * gridH) / Math.SQRT2,
    y: (size.height - scale * boundsH) / 2,
  };
}

// 点（枠の中の座標）を動かさずに倍率を変える
export function zoomAt(
  view: View,
  factor: number,
  px: number,
  py: number,
): View {
  const scale = clamp(view.scale * factor);
  const k = scale / view.scale;
  return { scale, x: px - (px - view.x) * k, y: py - (py - view.y) * k };
}

// マス・間・マスの並び。幅 1 のとき `repeat(0, …)` は CSS として無効になるため、repeat を使わずに並べる
export function tracks(count: number, tile: number): string {
  return Array.from({ length: 2 * count - 1 }, (_, i) =>
    i % 2 === 0 ? `${tile}px` : `${LINK}px`,
  ).join(" ");
}
