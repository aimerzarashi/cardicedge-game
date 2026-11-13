"use server";

import { refresh } from "next/cache";
import type { BoardTileElement } from "@/graphql/graphql";
import { callCore } from "@/lib/core";
import { ELEMENT_LABELS } from "../../boards/board-layout";
import {
  CORE_UNAVAILABLE_OPERATION,
  type FieldErrorValue,
  fieldErrorMessage,
  matchErrorMessage,
} from "../../messages";
import {
  attackMatchTerritoryMutation,
  changeMatchLandElementMutation,
  chooseMatchPathMutation,
  chooseMatchRewardPackMutation,
  defendMatchTerritoryMutation,
  discardMatchCardMutation,
  drawMatchCardMutation,
  endMatchTurnMutation,
  exchangeMatchCreatureMutation,
  invadeMatchTerritoryMutation,
  levelUpMatchTerritoryMutation,
  moveMatchCreatureMutation,
  payMatchTollMutation,
  placeMatchCreatureMutation,
  relinquishMatchTerritoryMutation,
  rollMatchDiceMutation,
  useMatchSpellMutation,
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

// 属性の名前の形だけを確かめる（変えられる属性かは core が判定する）
function isBoardTileElement(value: string): value is BoardTileElement {
  return value in ELEMENT_LABELS;
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

export async function useMatchSpell(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const handIndex = integer(form, "handIndex");
  if (id === undefined || revision === undefined || handIndex === undefined) {
    return BAD_FORM;
  }
  // 対象のプレイヤーを選ぶスペルは対象のプレイヤー、ダメージのスペルは対象の領地の位置を送る
  const target = integer(form, "target");
  const targetX = integer(form, "targetX");
  const targetY = integer(form, "targetY");
  const targetPosition =
    targetX !== undefined && targetY !== undefined
      ? { x: targetX, y: targetY }
      : undefined;
  const result = await callCore(useMatchSpellMutation, {
    input: { id, revision, handIndex, target, targetPosition },
  });
  return result.ok
    ? finish(result.data.useMatchSpell)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function placeMatchCreature(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const handIndex = integer(form, "handIndex");
  if (id === undefined || revision === undefined || handIndex === undefined) {
    return BAD_FORM;
  }
  const result = await callCore(placeMatchCreatureMutation, {
    input: { id, revision, handIndex },
  });
  return result.ok
    ? finish(result.data.placeMatchCreature)
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

export async function levelUpMatchTerritory(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const x = integer(form, "x");
  const y = integer(form, "y");
  const level = integer(form, "level");
  if (
    id === undefined ||
    revision === undefined ||
    x === undefined ||
    y === undefined ||
    level === undefined
  ) {
    return BAD_FORM;
  }
  const result = await callCore(levelUpMatchTerritoryMutation, {
    input: { id, revision, position: { x, y }, level },
  });
  return result.ok
    ? finish(result.data.levelUpMatchTerritory)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function moveMatchCreature(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const fromX = integer(form, "fromX");
  const fromY = integer(form, "fromY");
  const toX = integer(form, "toX");
  const toY = integer(form, "toY");
  if (
    id === undefined ||
    revision === undefined ||
    fromX === undefined ||
    fromY === undefined ||
    toX === undefined ||
    toY === undefined
  ) {
    return BAD_FORM;
  }
  const result = await callCore(moveMatchCreatureMutation, {
    input: {
      id,
      revision,
      from: { x: fromX, y: fromY },
      to: { x: toX, y: toY },
    },
  });
  return result.ok
    ? finish(result.data.moveMatchCreature)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function changeMatchLandElement(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const x = integer(form, "x");
  const y = integer(form, "y");
  const element = text(form, "element");
  if (
    id === undefined ||
    revision === undefined ||
    x === undefined ||
    y === undefined ||
    element === undefined ||
    !isBoardTileElement(element)
  ) {
    return BAD_FORM;
  }
  const result = await callCore(changeMatchLandElementMutation, {
    input: { id, revision, position: { x, y }, element },
  });
  return result.ok
    ? finish(result.data.changeMatchLandElement)
    : { error: CORE_UNAVAILABLE_OPERATION };
}

export async function exchangeMatchCreature(
  _previous: MatchActionState,
  form: FormData,
): Promise<MatchActionState> {
  const id = text(form, "id");
  const revision = integer(form, "revision");
  const x = integer(form, "x");
  const y = integer(form, "y");
  const handIndex = integer(form, "handIndex");
  if (
    id === undefined ||
    revision === undefined ||
    x === undefined ||
    y === undefined ||
    handIndex === undefined
  ) {
    return BAD_FORM;
  }
  const result = await callCore(exchangeMatchCreatureMutation, {
    input: { id, revision, position: { x, y }, handIndex },
  });
  return result.ok
    ? finish(result.data.exchangeMatchCreature)
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
