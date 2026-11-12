import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  abilitiesLabel,
  continuesLabel,
  curseLabel,
  fieldErrorMessage,
  itemRestrictionsLabel,
  matchNumberLabel,
  placementRestrictionsLabel,
  RULE_LABELS,
  type RuleField,
  ruleStep,
  spellEffectLabel,
} from "./messages.ts";

describe("placementRestrictionsLabel", () => {
  it("無ければ「なし」、あれば core の並びのまま属性をつなぐ", () => {
    assert.equal(placementRestrictionsLabel([]), "なし");
    assert.equal(placementRestrictionsLabel(["EARTH", "WIND"]), "地風");
  });
});

describe("abilitiesLabel", () => {
  it("無ければ「なし」、あれば能力の名前をつなぐ", () => {
    assert.equal(abilitiesLabel([]), "なし");
    assert.equal(abilitiesLabel([{ kind: "DEFENSIVE" }]), "防御型");
    assert.equal(
      abilitiesLabel([
        { kind: "DEFENSIVE" },
        { kind: "TOLL_MULTIPLIER", percent: 150 },
      ]),
      "防御型・通行料の倍率 150%",
    );
    assert.equal(
      abilitiesLabel([{ kind: "FIRST_STRIKE" }, { kind: "DEFENSIVE" }]),
      "先制・防御型",
    );
    assert.equal(abilitiesLabel([{ kind: "LAST_STRIKE" }]), "後手");
    assert.equal(
      abilitiesLabel([
        {
          kind: "BATTLE_MODIFIER",
          attackModifier: -10,
          hitPointsModifier: 20,
        },
      ]),
      "戦闘中の増減 AT -10・HP +20",
    );
    assert.equal(
      abilitiesLabel([
        { kind: "BATTLE_RANDOM_STATS", minimum: 10, maximum: 70 },
      ]),
      "戦闘中のランダム 10〜70",
    );
  });
});

describe("itemRestrictionsLabel", () => {
  it("無ければ「なし」、あれば core の並びのまま分類をつなぐ", () => {
    assert.equal(itemRestrictionsLabel([]), "なし");
    assert.equal(itemRestrictionsLabel(["ARMOR", "SCROLL"]), "防具・巻物");
  });
});

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
        baseLandValue: 1,
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

describe("spellEffectLabel", () => {
  it("効果の種類ごとに、core が返した値で言う", () => {
    assert.equal(
      spellEffectLabel({ __typename: "SpellDrawCardsEffect", count: 1 }),
      "カードを 1 枚引く",
    );
  });

  it("効果なし（null）は「なし」と出す", () => {
    assert.equal(spellEffectLabel(null), "なし");
  });

  it("ダメージは、core が返した値で言う", () => {
    assert.equal(
      spellEffectLabel({ __typename: "SpellDamageEffect", amount: 20 }),
      "対象のクリーチャーに 20 ダメージ",
    );
  });

  it("魔力を得る・サイコロを複数振るも、core が返した値で言う", () => {
    assert.equal(
      spellEffectLabel({ __typename: "SpellGainMagicEffect", perLap: 100 }),
      "（周回数 + 1）× 100 の魔力を得る",
    );
    assert.equal(
      spellEffectLabel({ __typename: "SpellRollDiceEffect", count: 2 }),
      "サイコロを 2 個同時に振る",
    );
  });
});

describe("curseLabel", () => {
  it("かかっている呪いは決まる目と残りのターン、無ければ「なし」", () => {
    assert.equal(
      curseLabel({ value: 6, remainingTurns: 1 }),
      "次のサイコロは 6（残り 1 ターン）",
    );
    assert.equal(curseLabel(null), "なし");
  });
});
