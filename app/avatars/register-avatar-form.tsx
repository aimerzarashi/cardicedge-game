"use client";

import { useActionState } from "react";
import { type RegisterAvatarState, registerAvatar } from "./actions";

const initialState: RegisterAvatarState = { value: "" };

export function RegisterAvatarForm() {
  const [state, formAction, isPending] = useActionState(
    registerAvatar,
    initialState,
  );

  return (
    <>
      {state.registered && (
        <p role="status">
          作りました。一覧に反映されるまで時間がかかっています。しばらくしてから再読み込みしてください。
        </p>
      )}
      {state.error && <p role="alert">{state.error}</p>}
      {/* 送信の後、React は入力欄を defaultValue に戻すため、誤りのときに入力した値が残るよう state の値を渡す */}
      <form action={formAction}>
        <label>
          名前
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
          作る
        </button>
      </form>
    </>
  );
}
