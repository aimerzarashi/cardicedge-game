"use server";

import { refresh } from "next/cache";
import { callCore } from "@/lib/core";
import {
  CORE_UNAVAILABLE_OPERATION,
  type FieldErrorValue,
  fieldErrorMessage,
  matchErrorMessage,
} from "../../messages";
import {
  attackMatchTerritoryMutation,
  chooseMatchPathMutation,
  chooseMatchRewardPackMutation,
  defendMatchTerritoryMutation,
  deployMatchCreatureMutation,
  discardMatchCardMutation,
  drawMatchCardMutation,
  endMatchTurnMutation,
  invadeMatchTerritoryMutation,
  payMatchTollMutation,
  relinquishMatchTerritoryMutation,
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

export async function deployMatchCreature(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const handIndex = integer(form, "handIndex");
  if (id === undefined || revision === undefined || handIndex === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(deployMatchCreatureMutation, {
    input: { id, revision, handIndex },
  });
  return result.ok
    ? finish(result.data.deployMatchCreature)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function relinquishMatchTerritory(
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
  const result = await callCore(relinquishMatchTerritoryMutation, {
    input: { id, revision, position: { x, y } },
  });
  return result.ok
    ? finish(result.data.relinquishMatchTerritory)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function invadeMatchTerritory(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const handIndex = integer(form, "handIndex");
  if (id === undefined || revision === undefined || handIndex === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(invadeMatchTerritoryMutation, {
    input: { id, revision, handIndex },
  });
  return result.ok
    ? finish(result.data.invadeMatchTerritory)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function attackMatchTerritory(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  if (id === undefined || revision === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(attackMatchTerritoryMutation, {
    input: { id, revision, itemHandIndex: integer(form, "itemHandIndex") },
  });
  return result.ok
    ? finish(result.data.attackMatchTerritory)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function payMatchToll(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  if (id === undefined || revision === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(payMatchTollMutation, {
    input: { id, revision },
  });
  return result.ok
    ? finish(result.data.payMatchToll)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function defendMatchTerritory(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  if (id === undefined || revision === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(defendMatchTerritoryMutation, {
    input: { id, revision, itemHandIndex: integer(form, "itemHandIndex") },
  });
  return result.ok
    ? finish(result.data.defendMatchTerritory)
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
