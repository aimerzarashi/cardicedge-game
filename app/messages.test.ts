import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  continuesLabel,
  effectsLabel,
  effectView,
  fieldErrorMessage,
  itemRestrictionsLabel,
  lastingSpellEffectLabel,
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

// クリーチャーの効果もアイテムと同じ表示（core#178）
describe("effectsLabel (creature)", () => {
  it("クリーチャーの効果を並びのまま値つきで出し、上書きは範囲、攻撃無効は相手の属性を添える", () => {
    assert.equal(
      effectsLabel([
        { kind: "FORBID_INVASION" },
        { kind: "FORBID_MOVEMENT" },
        { kind: "HIT_POINTS_MODIFIER", value: 20 },
        { kind: "ATTACK_OVERRIDE", minimum: 10, maximum: 70 },
        { kind: "HIT_POINTS_OVERRIDE", minimum: 10, maximum: 70 },
        { kind: "STRIKE_FIRST" },
        { kind: "STRIKE_LAST" },
        { kind: "TOLL_MULTIPLIER", percent: 150 },
        {
          kind: "NULLIFY_RECEIVED_DAMAGE",
          opponentElements: ["FIRE", "EARTH"],
        },
        { kind: "NULLIFY_RECEIVED_DAMAGE" },
      ]),
      "侵略できない・移動できない・HP +20・AT を 10〜70 に上書き・HP を 10〜70 に上書き・先制・後手・通行料の倍率 150%・攻撃無効（相手が火地）・攻撃無効",
    );
  });
});

// 破壊されたときの効果は、発動する破壊を添える（core#182）
describe("effectsLabel (destruction)", () => {
  it("破壊されたら手札に戻る・魔力を得るは、発動する破壊と額を出す", () => {
    assert.equal(
      effectsLabel([
        {
          kind: "RETURN_TO_HAND_ON_DESTRUCTION",
          destructions: ["INVADING", "DEFENDING"],
        },
        {
          kind: "GAIN_MAGIC_ON_DESTRUCTION",
          destructions: ["INVADING", "DEFENDING", "BOARD"],
          amount: 200,
        },
      ]),
      "破壊されたら手札に戻る（侵略したとき・守るとき）・破壊されたら魔力 +200（侵略したとき・守るとき・ボード）",
    );
  });
});

describe("itemRestrictionsLabel", () => {
  it("無ければ「なし」、あれば core の並びのまま分類をつなぐ", () => {
    assert.equal(itemRestrictionsLabel([]), "なし");
    assert.equal(itemRestrictionsLabel(["ARMOR", "SCROLL"]), "防具・巻物");
  });
});

describe("effectsLabel (item)", () => {
  it("アイテムの効果を並びのまま値つきで出し、強打は相手の属性を添え、無ければ「効果なし」", () => {
    const effects = [
      { kind: "ATTACK_OVERRIDE", minimum: 30, maximum: 30 },
      {
        kind: "ATTACK_MULTIPLIER",
        percent: 150,
        constraints: [{ elements: ["WATER"] }],
      },
      { kind: "IGNORE_TERRAIN_EFFECT" },
      { kind: "HIT_POINTS_MODIFIER", value: -10 },
    ] as const;
    assert.equal(
      effectsLabel(
        effects.map((effect) =>
          effectView({
            ...effect,
            constraints:
              "constraints" in effect
                ? effect.constraints.map((c) => ({ elements: [...c.elements] }))
                : undefined,
          }),
        ),
      ),
      "AT を 30 に上書き・強打 150%（相手が水）・地形効果を無視する・HP -10",
    );
    assert.equal(effectsLabel([]), "効果なし");
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
        lapBonusPerTerritory: 10,
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
      spellEffectLabel({ __typename: "DrawCardsSpellEffect", count: 1 }),
      "カードを 1 枚引く",
    );
  });

  it("効果なし（null）は「なし」と出す", () => {
    assert.equal(spellEffectLabel(null), "なし");
  });

  it("ダメージは、core が返した値で言う", () => {
    assert.equal(
      spellEffectLabel({ __typename: "DamageSpellEffect", amount: 20 }),
      "対象のクリーチャーに 20 ダメージ",
    );
  });

  it("魔力を得る・サイコロを複数振る・サイコロの目を固定するも、core が返した値で言う", () => {
    assert.equal(
      spellEffectLabel({ __typename: "GainMagicSpellEffect", perLap: 100 }),
      "（周回数 + 1）× 100 の魔力を得る",
    );
    assert.equal(
      spellEffectLabel({
        __typename: "MultipleDiceSpellEffect",
        count: 2,
        turns: 1,
      }),
      "対象のサイコロを 2 個同時に振る（1 ターン）",
    );
    assert.equal(
      spellEffectLabel({
        __typename: "FixedDiceSpellEffect",
        value: 6,
        turns: 3,
      }),
      "対象のサイコロの目を 6 に固定する（3 ターン）",
    );
  });
});

describe("lastingSpellEffectLabel", () => {
  it("続いているスペルの効果は名前と効き方・残りのターン、無ければ「なし」", () => {
    assert.equal(
      lastingSpellEffectLabel({
        effect: { __typename: "FixedDiceSpellEffect", value: 6, turns: 3 },
        remainingTurns: 1,
      }),
      "サイコロの目を固定する（目 6・残り 1 ターン）",
    );
    assert.equal(
      lastingSpellEffectLabel({
        effect: { __typename: "MultipleDiceSpellEffect", count: 2, turns: 3 },
        remainingTurns: 2,
      }),
      "サイコロを複数振る（2 個・残り 2 ターン）",
    );
    assert.equal(lastingSpellEffectLabel(null), "なし");
  });
});
