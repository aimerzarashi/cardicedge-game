"use client";

import { type ReactNode, useActionState } from "react";
import type { MatchActionState } from "./actions";

// 対戦の操作のボタン。対戦の ID と、画面が読んだ revision に、操作ごとの値（手札の番号・行き先の座標）を足して送る
export function MatchActionButton({
  action,
  id,
  revision,
  values,
  children,
}: {
  action: (
    previous: MatchActionState,
    form: FormData,
  ) => Promise<MatchActionState>;
  id: string;
  revision: number;
  values?: Record<string, number>;
  children: ReactNode;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="revision" value={revision} />
      {Object.entries(values ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {state.error && <p role="alert">{state.error}</p>}
      <button type="submit" disabled={isPending}>
        {children}
      </button>
    </form>
  );
}
