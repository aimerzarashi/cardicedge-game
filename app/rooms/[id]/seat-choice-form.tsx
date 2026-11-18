"use client";

import { useActionState, useState } from "react";
import { changeSeatChoice, type RoomActionState } from "./actions";

export type AvatarOption = {
  id: string;
  name: string;
  // このアバターで選べるデッキ（プレイヤーの席は自分のデッキ、NPC の席は割り当てたデッキ）
  decks: { id: string; name: string }[];
  // NPC の席だけで選ぶ（プレイヤーの席に付けると core が誤りにするため、プレイヤーのアバターには持たせない）
  mindsets?: { id: string; name: string }[];
};

export function SeatChoiceForm({
  id,
  revision,
  seat,
  avatars,
  currentAvatarId,
  currentDeckId,
  currentMindsetId,
}: {
  id: string;
  revision: number;
  seat: number;
  avatars: AvatarOption[];
  currentAvatarId?: string;
  currentDeckId?: string;
  currentMindsetId?: string;
}) {
  const [state, formAction, isPending] = useActionState<
    RoomActionState,
    FormData
  >(changeSeatChoice, {});
  const [avatarId, setAvatarId] = useState<string | undefined>(
    currentAvatarId ?? avatars[0]?.id,
  );
  const selectedAvatar = avatars.find((avatar) => avatar.id === avatarId);
  const decks = selectedAvatar?.decks ?? [];
  const mindsets = selectedAvatar?.mindsets;
  const [deckId, setDeckId] = useState<string | undefined>(
    currentDeckId ?? decks[0]?.id,
  );
  const [mindsetId, setMindsetId] = useState<string | undefined>(
    currentMindsetId ?? mindsets?.[0]?.id,
  );

  if (!avatarId || !deckId || (mindsets && !mindsetId)) {
    return <p>選べるアバター・デッキ・思考パターンがありません</p>;
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
            setMindsetId(next?.mindsets?.[0]?.id);
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
      {mindsets && (
        <label>
          思考パターン
          <select
            name="mindsetId"
            value={mindsetId}
            onChange={(event) => setMindsetId(event.target.value)}
          >
            {mindsets.map((mindset) => (
              <option key={mindset.id} value={mindset.id}>
                {mindset.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <button type="submit" disabled={isPending}>
        席 {seat + 1} を決める
      </button>
    </form>
  );
}
