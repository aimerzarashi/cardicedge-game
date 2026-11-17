"use client";

import { useActionState } from "react";
import { changeSeats, type RoomActionState } from "./actions";

export function SeatsForm({
  id,
  revision,
  min,
  max,
  current,
  withPlayer,
}: {
  id: string;
  revision: number;
  // ゲーム全体のルール（gameRules）の人数の範囲
  min: number;
  max: number;
  // 今の席の数（まだ決めていなければ 0）
  current: number;
  // 今の席の並びに自分のプレイヤーの席があるか（まだ決めていなければ true）
  withPlayer: boolean;
}) {
  const [state, formAction, isPending] = useActionState<
    RoomActionState,
    FormData
  >(changeSeats, {});
  const counts = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="revision" value={revision} />
      {state.error && <p role="alert">{state.error}</p>}
      <label>
        <input type="checkbox" name="withPlayer" defaultChecked={withPlayer} />
        自分も参加する（外すと全員 NPC で、自分は対戦を見るだけ）
      </label>
      <label>
        席の数（自分が参加するなら自分のプレイヤーの席 1 つと、残りは NPC の席）
        <select name="seatCount" defaultValue={current || min}>
          {counts.map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={isPending}>
        席を決める
      </button>
    </form>
  );
}
