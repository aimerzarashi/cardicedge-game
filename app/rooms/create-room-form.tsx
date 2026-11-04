"use client";

import { useActionState } from "react";
import { type CreateRoomState, createRoom } from "./actions";

const initialState: CreateRoomState = { value: "" };

export function CreateRoomForm() {
  const [state, formAction, isPending] = useActionState(
    createRoom,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.error && <p role="alert">{state.error}</p>}
      {/* 送信の後、React は入力欄を defaultValue に戻すため、誤りのときに入力した値が残るよう state の値を渡す */}
      <label>
        部屋の名前
        <input
          name="name"
          required
          defaultValue={state.value}
          aria-invalid={state.nameError ? true : undefined}
          aria-describedby={state.nameError ? "name-error" : undefined}
        />
      </label>
      {state.nameError && (
        <p id="name-error" role="alert">
          {state.nameError}
        </p>
      )}
      <button type="submit" disabled={isPending}>
        部屋を作る
      </button>
    </form>
  );
}
