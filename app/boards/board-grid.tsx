"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";
import {
  type Pair,
  type PairLabel,
  type Position,
  pairLabel,
  type Tile,
  tileAt,
  tileLabel,
} from "./board-layout";
import {
  BOARD_BACKGROUND,
  LEGEND,
  paint,
  tileName,
  tileText,
} from "./board-paint";
import {
  fitView,
  type Size,
  span,
  TILE,
  tracks,
  type View,
  ZOOM_STEP,
  zoomAt,
} from "./board-view";

// ボードを斜め見下ろしで見せる格子。studio の app/boards/board-grid.tsx から写したもの（片方を変えたらもう片方もそろえる）。
// 写したあとの違いは、押す操作（onTile・onConnection）と、そのためのクリックの打ち消しを持たないことと、
// マスとマスの間（つながりの印）とマスの無い所を描かないこと（game では空白にして背景を見せる。オーナーの判断。マスの無い所は game#13）、
// 相手待ち（pending）・印（marks・focus）を持たないこと（編集と公開の検査のためのもので、game では使わない）。
// 転送円・橋の「相手なし」と「?」は、game のボードは公開中だけで現れないが、写しをそろえるため残している。
//
// 並べ方: 幅 W・高さ H のボードを (2W−1) 列 × (2H−1) 行の CSS grid にし、偶数の位置をマス、奇数の位置を隣どうしの間の印
// （つながり）にする（奇数 × 奇数は空き）。この grid 全体を `scaleY(0.5) rotate(45deg)` で回してつぶし、マスを ◇ に見せる。
//   マス: 名前「(x, y) のマス」＋置いてあれば種類（土地は属性つき。例: 「(2, 0) のマス 拠点」「(1, 0) のマス 火属性の土地」）。種類・属性は色で見せる。
//     マスの中に文字を書くのは特殊なマスだけ（転送円・橋は対の番号「1-1」「1-2」、相手のいないものは「?」。施設は 1 文字）。名前にも番号が付く（「転送円 1-1」「橋 相手なし」）
//   横の間: 「(x, y) と (x+1, y) のつながり」、縦の間: 「(x, y) と (x, y+1) のつながり」（つながっているかは aria-pressed）
// 対: pairs で転送円・橋の番号を決める（番号の振り方は board-layout.ts の pairLabel）。
// 見方: はみ出した分はスクロールバーではなく、枠の中で表示を動かして見る（ドラッグで動かす・ホイールとボタンで拡大縮小）。
// ポインターとホイールの処理を持つため、Server Component（ボードの詳細）から使えるよう Client Component にしている

// 拡大・縮小で新しい倍率へ動く時間（ms）。続けて回したときも、動いている途中から次へ向かう
const ZOOM_DURATION = 200;
// 押してからこの距離（px）動いたらドラッグ
const DRAG_THRESHOLD = 4;

export function BoardGrid({
  width,
  height,
  tiles,
  pairs,
}: {
  width: number;
  height: number;
  tiles: Tile[];
  pairs: Pair[];
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  // null の間は、ボード全体が枠に収まる大きさで中央に置く
  const [view, setView] = useState<View | null>(null);
  const [dims, setDims] = useState({ width, height });
  if (dims.width !== width || dims.height !== height) {
    setDims({ width, height });
    setView(null);
  }
  const drag = useRef<{
    startX: number;
    startY: number;
    from: View;
    moved: boolean;
  } | null>(null);

  // 拡大・縮小・全体を表示は、新しい倍率と位置へなめらかに動かす（カメラワーク）。最初に開いたときは収まる位置にそのまま出し、
  // ドラッグの最中は指やマウスにそのまま付いてくるよう遅らせない
  const [animated, setAnimated] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fitted = size ? fitView(size, width, height) : null;
  const shown = view ?? fitted;

  // ホイールの既定のスクロールを止めるには passive でない listener が要り、React の onWheel では付けられないため DOM に付ける
  useEffect(() => {
    const element = viewport.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = viewport.current;
    if (!element || !size) {
      return;
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      setAnimated(true);
      setView((current) =>
        zoomAt(
          current ?? fitView(size, width, height),
          factor,
          event.clientX - rect.left,
          event.clientY - rect.top,
        ),
      );
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [size, width, height]);

  function zoom(factor: number) {
    if (!size || !shown) {
      return;
    }
    setAnimated(true);
    setView(zoomAt(shown, factor, size.width / 2, size.height / 2));
  }

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0 || !shown) {
      return;
    }
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      from: shown,
      moved: false,
    };
  }

  function pointerMove(event: PointerEvent) {
    const d = drag.current;
    if (!d) {
      return;
    }
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      d.moved = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (d.moved) {
      setView({ ...d.from, x: d.from.x + dx, y: d.from.y + dy });
    }
  }

  function pointerEnd() {
    drag.current = null;
    setDragging(false);
  }

  const cells = [];
  for (let row = 0; row < 2 * height - 1; row++) {
    for (let column = 0; column < 2 * width - 1; column++) {
      const key = `${column}-${row}`;
      const x = Math.floor(column / 2);
      const y = Math.floor(row / 2);
      if (column % 2 === 0 && row % 2 === 0) {
        const tile = tileAt(tiles, { x, y });
        cells.push(
          // マスの無い所は描かない（間と同じく空白にして背景を見せる。空きは studio の編集で押す場所のためのもの）
          tile ? (
            <TileButton
              key={key}
              position={{ x, y }}
              tile={tile}
              pair={pairLabel({ tiles, pairs }, tile)}
            />
          ) : (
            <span key={key} />
          ),
        );
      } else if (column % 2 === row % 2) {
        cells.push(<span key={key} />);
      } else {
        // マスとマスの間は描かない（空白にして背景を見せる。将来は背景画を敷く）。つながりの印は studio の編集のためのもの
        cells.push(<span key={key} />);
      }
    }
  }

  return (
    // fieldset の既定の min-inline-size（min-content）だと、中身の幅に合わせて広がり、枠からはみ出して隠れるため 0 にする
    <fieldset
      aria-label="ボードの格子"
      style={{ border: "none", margin: 0, padding: 0, minInlineSize: 0 }}
    >
      <div>
        <button type="button" onClick={() => zoom(ZOOM_STEP)}>
          拡大
        </button>
        <button type="button" onClick={() => zoom(1 / ZOOM_STEP)}>
          縮小
        </button>
        <button
          type="button"
          onClick={() => {
            setAnimated(true);
            setView(null);
          }}
        >
          全体を表示
        </button>
      </div>
      <div
        ref={viewport}
        data-scale={shown ? shown.scale.toFixed(3) : undefined}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={pointerEnd}
        style={{
          position: "relative",
          height: "28rem",
          // はみ出しはスクロールではなく隠す。clip は、フォーカスの移動でも勝手にスクロールされない
          overflow: "clip",
          touchAction: "none",
          userSelect: "none",
          border: "1px solid #999",
          // 画面のモード（ダーク・通常）によらず暗い色に固定する（studio と同じ。将来は背景画を敷く）
          background: BOARD_BACKGROUND,
          // 枠の大きさが分かるまでは、収め方が決まらないため出さない
          visibility: shown ? "visible" : "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            display: "grid",
            gridTemplateColumns: tracks(width, TILE),
            gridTemplateRows: tracks(height, TILE),
            width: span(width),
            height: span(height),
            transformOrigin: "0 0",
            transition:
              animated && !dragging
                ? `transform ${ZOOM_DURATION}ms ease-out`
                : "none",
            transform: shown
              ? `translate(${shown.x}px, ${shown.y}px) scale(${shown.scale}) scaleY(0.5) rotate(45deg)`
              : undefined,
          }}
        >
          {cells}
        </div>
      </div>
      <ul
        aria-label="凡例"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          listStyle: "none",
          padding: 0,
        }}
      >
        {LEGEND.map((sample) => (
          <li key={tileLabel(sample)}>
            <span
              aria-hidden
              style={{
                ...paint(sample),
                display: "inline-block",
                boxSizing: "border-box",
                width: "1em",
                height: "1em",
                marginRight: "0.25em",
                verticalAlign: "middle",
              }}
            />
            {tileLabel(sample)}
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

// 表示だけで押せないが、マスの名前（aria-label）で見つけられるよう button のまま写している
function TileButton({
  position,
  tile,
  pair,
}: {
  position: Position;
  tile: Tile;
  // 転送円・橋の対の番号（対になっていなければ無い）
  pair: PairLabel | undefined;
}) {
  const text = tileText(tile, pair);
  return (
    <button
      type="button"
      aria-label={tileName(position, tile, pair)}
      disabled
      style={{
        ...paint(tile),
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {text !== undefined && (
        // 盤面の回転（scaleY(0.5) rotate(45deg)）を打ち消して、文字を正面に向ける
        <span
          aria-hidden
          style={{
            transform: "rotate(-45deg) scaleY(2)",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: "bold",
            lineHeight: 1,
            textShadow: "0 0 2px #000, 0 0 2px #000",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      )}
    </button>
  );
}
