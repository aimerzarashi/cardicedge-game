import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  continuesLabel,
  fieldErrorMessage,
  matchNumberLabel,
  RULE_LABELS,
  type RuleField,
  ruleStep,
} from "./messages.ts";

describe("ruleStep", () => {
  it("魔力は 100 刻み、ラウンドの上限とサイコロの目は 1 刻みにする", () => {
    assert.deepEqual(
      Object.fromEntries(
        (Object.keys(RULE_LABELS) as RuleField[]).map((field) => [
          field,
          ruleStep(field),
        ]),
      ),
      {
        targetMagic: 100,
        startingMagic: 100,
        lapBonus: 100,
        checkpointBonus: 100,
        roundLimit: 1,
        diceMin: 1,
        diceMax: 1,
      },
    );
  });
});

describe("fieldErrorMessage", () => {
  it("サイコロの目の最大が最小以下のときは、比べる相手の項目名から文言を作る", () => {
    assert.equal(
      fieldErrorMessage({
        __typename: "FieldNotGreaterThan",
        field: "diceMax",
        than: "diceMin",
      }),
      "サイコロの目（最大）は「サイコロの目（最小）」より大きくしてください",
    );
  });
});

describe("continuesLabel", () => {
  it("まだ選んでいない人（null）は「まだ」、続ける人は「続ける」、終える人は「終える」", () => {
    assert.deepEqual([null, undefined, true, false].map(continuesLabel), [
      "まだ",
      "まだ",
      "続ける",
      "終える",
    ]);
  });
});

describe("matchNumberLabel", () => {
  it("1 始まりの番号を「n 戦目」にする", () => {
    assert.deepEqual([1, 2, 10].map(matchNumberLabel), [
      "1 戦目",
      "2 戦目",
      "10 戦目",
    ]);
  });
});
