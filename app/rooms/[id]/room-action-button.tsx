"use client";

import { type ReactNode, useActionState } from "react";
import type { RoomActionState } from "./actions";

// 公開・準備完了・閉じるのように、部屋の ID と revision（と、あれば 1 つ 2 つの値）を渡す操作のボタン
export function RoomActionButton({
  action,
  id,
  revision,
  values,
  disabled,
  children,
}: {
  action: (
    previous: RoomActionState,
    form: FormData,
  ) => Promise<RoomActionState>;
  id: string;
  revision: number;
  values?: Record<string, string>;
  disabled?: boolean;
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
      <button type="submit" disabled={disabled || isPending}>
        {children}
      </button>
    </form>
  );
}
