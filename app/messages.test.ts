import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RULE_LABELS, type RuleField, ruleStep } from "./messages.ts";

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
