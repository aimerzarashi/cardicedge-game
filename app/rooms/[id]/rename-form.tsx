"use client";

import { useActionState } from "react";
import { type RoomActionState, renameRoom } from "./actions";

export function RenameForm({
  id,
  revision,
  name,
}: {
  id: string;
  revision: number;
  name: string;
}) {
  const [state, formAction, isPending] = useActionState<
    RoomActionState,
    FormData
  >(renameRoom, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="revision" value={revision} />
      {state.error && <p role="alert">{state.error}</p>}
      <label>
        部屋の名前
        <input name="name" required defaultValue={name} />
      </label>
      <button type="submit" disabled={isPending}>
        名前を変える
      </button>
    </form>
  );
}
