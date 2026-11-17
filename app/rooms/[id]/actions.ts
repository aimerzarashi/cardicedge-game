"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { callCore } from "@/lib/core";
import {
  CORE_UNAVAILABLE_OPERATION,
  type FieldErrorValue,
  fieldErrorMessage,
  NOT_REFLECTED,
  nameErrorMessage,
  RULE_LABELS,
  type RuleField,
  roomErrorMessage,
} from "../../messages";
import {
  changeRoomMatchRulesMutation,
  changeRoomSeatChoiceMutation,
  changeRoomSeatsMutation,
  closeRoomMutation,
  declareRoomNextMutation,
  declareRoomReadyMutation,
  publishRoomMutation,
  renameRoomMutation,
  resumeRoomMutation,
  roomMatchQuery,
} from "../operations";
import { waitStartedMatch } from "../wait-match";
import { waitRoom } from "../wait-room";

export type RoomActionState = { error?: string };

type Outcome = {
  __typename: string;
  id?: string;
  revision?: number;
  errors?: FieldErrorValue[];
};

// 成功の型の名前は操作ごとに違い、どれも Success で終わる。それ以外はすべて誤りとして表示する
async function finish(outcome: Outcome): Promise<RoomActionState> {
  if (outcome.__typename.endsWith("Success")) {
    // 詳細は投影から読むため、操作の結果の revision に届いてから、変えたあとの revision と内容で出し直す
    const reached =
      outcome.id !== undefined && outcome.revision !== undefined
        ? await waitRoom(outcome.id, outcome.revision)
        : "timeout";
    refresh();
    return reached === "reached" ? {} : { error: NOT_REFLECTED };
  }
  if (outcome.__typename === "ValidationErrors" && outcome.errors) {
    if (outcome.errors.every((error) => error.field === "name")) {
      return { error: nameErrorMessage(outcome.errors) };
    }
    return { error: outcome.errors.map(fieldErrorMessage).join("。") };
  }
  return { error: roomErrorMessage(outcome.__typename) };
}

// 中身の正誤は core が判定するため、ここでは形（文字列・整数であること）だけを確かめる
function text(form: FormData, name: string): string | undefined {
  const value = form.get(name);
  return typeof value === "string" ? value : undefined;
}

function integer(form: FormData, name: string): number | undefined {
  const value = text(form, name);
  if (value === undefined || !/^-?\d+$/.test(value)) {
    return undefined;
  }
  return Number(value);
}

const BAD_FORM: RoomActionState = { error: "入力を確かめてください" };

export async function changeSeats(
  _previous: RoomActionState,
  form: FormData,
): Promise<RoomActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const count = integer(form, "seatCount");
  if (id === undefined || revision === undefined || count === undefined) {
    return BAD_FORM;
  }
  // プレイヤーの席は自分の 1 つだけで、ほかは NPC の席の個人戦。自分が参加しなければ全員 NPC（作った人は対戦を見るだけ。
  // 2026-11-17 オーナー。game#109）。チェックボックスは外すと送られない
  const withPlayer = form.get("withPlayer") !== null;
  const seats = Array.from({ length: Math.max(count, 0) }, (_, index) =>
    withPlayer && index === 0 ? ("PLAYER" as const) : ("NPC" as const),
  );
  const result = await callCore(changeRoomSeatsMutation, {
    input: { id, revision, seats },
  });
  return result.ok
    ? finish(result.data.changeRoomSeats)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function changeMatchRules(
  _previous: RoomActionState,
  form: FormData,
): Promise<RoomActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const boardId = text(form, "boardId");
  if (id === undefined || revision === undefined || boardId === undefined) {
    return BAD_FORM;
  }
  const values: Partial<Record<RuleField, number>> = {};
  for (const field of Object.keys(RULE_LABELS) as RuleField[]) {
    const value = integer(form, field);
    if (value === undefined) {
      return { error: `${RULE_LABELS[field]}は整数で入力してください` };
    }
    values[field] = value;
  }
  const result = await callCore(changeRoomMatchRulesMutation, {
    input: { id, revision, boardId, ...(values as Record<RuleField, number>) },
  });
  return result.ok
    ? finish(result.data.changeRoomMatchRules)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function changeSeatChoice(
  _previous: RoomActionState,
  form: FormData,
): Promise<RoomActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const seat = integer(form, "seat");
  const avatarId = text(form, "avatarId");
  const deckId = text(form, "deckId");
  if (
    id === undefined ||
    revision === undefined ||
    seat === undefined ||
    avatarId === undefined ||
    deckId === undefined
  ) {
    return BAD_FORM;
  }
  const result = await callCore(changeRoomSeatChoiceMutation, {
    input: { id, revision, seat, avatarId, deckId },
  });
  return result.ok
    ? finish(result.data.changeRoomSeatChoice)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function publishRoom(
  _previous: RoomActionState,
  form: FormData,
): Promise<RoomActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  if (id === undefined || revision === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(publishRoomMutation, {
    input: { id, revision },
  });
  return result.ok
    ? finish(result.data.publishRoom)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function declareRoomReady(
  _previous: RoomActionState,
  form: FormData,
): Promise<RoomActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  if (id === undefined || revision === undefined) {
    return BAD_FORM;
  }
  // 前の対戦が残っているので、始まった対戦と区別できるよう、準備完了の前の対戦の ID を控える
  const before = await callCore(roomMatchQuery, { id });
  const previousId =
    before.ok && before.data.room.__typename === "Room"
      ? before.data.room.match?.id
      : undefined;
  const result = await callCore(declareRoomReadyMutation, {
    input: { id, revision },
  });
  if (!result.ok) {
    return { error: CORE_UNAVAILABLE_OPERATION };
  }
  const state = await finish(result.data.declareRoomReady);
  if (state.error !== undefined) {
    return state;
  }
  // 全員がそろうと部屋が対戦中になり、ポリシーが対戦を作る。対戦が出るまで読み直し、出れば対戦の画面へ移す。対戦中でなければ
  // （ほかのプレイヤーの待ち）今の部屋を出し直したままにする。Room.match は次の対戦を始めるまで終わった対戦のままなので、
  // 準備完了の前の対戦の ID と違うかで見分ける（待ち方は wait-match.ts）
  const matchId = await waitStartedMatch(id, previousId);
  if (matchId) {
    redirect(`/matches/${matchId}/debug`);
  }
  return state;
}

export async function declareRoomNext(
  _previous: RoomActionState,
  form: FormData,
): Promise<RoomActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const choice = text(form, "continue");
  if (
    id === undefined ||
    revision === undefined ||
    (choice !== "true" && choice !== "false")
  ) {
    return BAD_FORM;
  }
  const result = await callCore(declareRoomNextMutation, {
    input: { id, revision, continue: choice === "true" },
  });
  return result.ok
    ? finish(result.data.declareRoomNext)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function resumeRoom(
  _previous: RoomActionState,
  form: FormData,
): Promise<RoomActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  if (id === undefined || revision === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(resumeRoomMutation, {
    input: { id, revision },
  });
  return result.ok
    ? finish(result.data.resumeRoom)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function closeRoom(
  _previous: RoomActionState,
  form: FormData,
): Promise<RoomActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  if (id === undefined || revision === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(closeRoomMutation, { input: { id, revision } });
  return result.ok
    ? finish(result.data.closeRoom)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function renameRoom(
  _previous: RoomActionState,
  form: FormData,
): Promise<RoomActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const name = text(form, "name");
  if (id === undefined || revision === undefined || name === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(renameRoomMutation, {
    input: { id, revision, name },
  });
  return result.ok
    ? finish(result.data.renameRoom)
    : { error: CORE_UNAVAILABLE_OPERATION };
}
