"use client";

import { useActionState, useState } from "react";
import { changeSeatChoice, type RoomActionState } from "./actions";

export type AvatarOption = {
  id: string;
  name: string;
  // このアバターで選べるデッキ（プレイヤーの席は自分のデッキ、NPC の席は割り当てたデッキ）
  decks: { id: string; name: string }[];
};

export function SeatChoiceForm({
  id,
  revision,
  seat,
  avatars,
  currentAvatarId,
  currentDeckId,
}: {
  id: string;
  revision: number;
  seat: number;
  avatars: AvatarOption[];
  currentAvatarId?: string;
  currentDeckId?: string;
}) {
  const [state, formAction, isPending] = useActionState<
    RoomActionState,
    FormData
  >(changeSeatChoice, {});
  const [avatarId, setAvatarId] = useState<string | undefined>(
    currentAvatarId ?? avatars[0]?.id,
  );
  const decks = avatars.find((avatar) => avatar.id === avatarId)?.decks ?? [];
  const [deckId, setDeckId] = useState<string | undefined>(
    currentDeckId ?? decks[0]?.id,
  );

  if (!avatarId || !deckId) {
    return <p>選べるアバターまたはデッキがありません</p>;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="revision" value={revision} />
      <input type="hidden" name="seat" value={seat} />
      {state.error && <p role="alert">{state.error}</p>}
      <label>
        アバター
        <select
          name="avatarId"
          value={avatarId}
          onChange={(event) => {
            setAvatarId(event.target.value);
            // デッキはアバターごとに選べるものが違うため、先頭に戻す
            const next = avatars.find((a) => a.id === event.target.value);
            setDeckId(next?.decks[0]?.id);
          }}
        >
          {avatars.map((avatar) => (
            <option key={avatar.id} value={avatar.id}>
              {avatar.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        デッキ
        <select
          name="deckId"
          value={deckId}
          onChange={(event) => setDeckId(event.target.value)}
        >
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={isPending}>
        席 {seat + 1} を決める
      </button>
    </form>
  );
}
