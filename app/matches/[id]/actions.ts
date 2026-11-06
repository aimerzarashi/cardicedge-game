"use server";

import { refresh } from "next/cache";
import { callCore } from "@/lib/core";
import {
  CORE_UNAVAILABLE_OPERATION,
  type FieldErrorValue,
  fieldErrorMessage,
  matchErrorMessage,
} from "../../messages";
import type { MatchEventView } from "../match-events";
import {
  chooseMatchPathMutation,
  chooseMatchRewardPackMutation,
  discardMatchCardMutation,
  drawMatchCardMutation,
  endMatchTurnMutation,
  matchEventsQuery,
  rollMatchDiceMutation,
} from "../operations";

export type MatchActionState = { error?: string };

type Outcome = { __typename: string; errors?: FieldErrorValue[] };

// どの結果でも画面を読み直す。誤り（ほかで進んだ・番が違う・段階が違う）のときも、今の状態を出すため
function finish(outcome: Outcome): MatchActionState {
  refresh();
  if (outcome.__typename.endsWith("Success")) {
    return {};
  }
  if (outcome.__typename === "ValidationErrors" && outcome.errors) {
    return { error: outcome.errors.map(fieldErrorMessage).join("。") };
  }
  return { error: matchErrorMessage(outcome.__typename) };
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

const BAD_FORM: MatchActionState = { error: "入力を確かめてください" };

export async function drawMatchCard(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  if (id === undefined || revision === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(drawMatchCardMutation, {
    input: { id, revision },
  });
  return result.ok
    ? finish(result.data.drawMatchCard)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function discardMatchCard(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const handIndex = integer(form, "handIndex");
  if (id === undefined || revision === undefined || handIndex === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(discardMatchCardMutation, {
    input: { id, revision, handIndex },
  });
  return result.ok
    ? finish(result.data.discardMatchCard)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function rollMatchDice(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  if (id === undefined || revision === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(rollMatchDiceMutation, {
    input: { id, revision },
  });
  return result.ok
    ? finish(result.data.rollMatchDice)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function chooseMatchPath(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const x = integer(form, "x");
  const y = integer(form, "y");
  if (
    id === undefined ||
    revision === undefined ||
    x === undefined ||
    y === undefined
  ) {
    return BAD_FORM;
  }
  const result = await callCore(chooseMatchPathMutation, {
    input: { id, revision, to: { x, y } },
  });
  return result.ok
    ? finish(result.data.chooseMatchPath)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function endMatchTurn(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  if (id === undefined || revision === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(endMatchTurnMutation, {
    input: { id, revision },
  });
  return result.ok
    ? finish(result.data.endMatchTurn)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function chooseMatchRewardPack(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const pack = text(form, "pack");
  if (id === undefined || revision === undefined || pack === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(chooseMatchRewardPackMutation, {
    input: { id, revision, pack },
  });
  return result.ok
    ? finish(result.data.chooseMatchRewardPack)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export type MatchEventsResult =
  | { ok: true; events: MatchEventView[] }
  | { ok: false };

// ブラウザは core を直接呼ばない決まりなので、差分は game のサーバーから読む（Subscription だけが例外）。
// 画面が呼ぶのは版が進んだときだけで、読み直しのたびに全部は読まない
export async function loadMatchEvents(
  id: string,
  after: number,
): Promise<MatchEventsResult> {
  if (typeof id !== "string" || !Number.isInteger(after) || after < 0) {
    return { ok: false };
  }
  const result = await callCore(matchEventsQuery, { id, after });
  if (!result.ok || result.data.matchEvents.__typename !== "MatchEventList") {
    return { ok: false };
  }
  return { ok: true, events: result.data.matchEvents.events };
}
