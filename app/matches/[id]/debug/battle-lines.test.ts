import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  battleSideTitleParts,
  battleStatLine,
  battleStatParts,
} from "./battle-lines.ts";
import type { FrameBattleSide } from "./match-frame.ts";

const SIDE: FrameBattleSide = {
  name: "コーンフォーク",
  item: "レザーアーマー",
  initial: { attack: 30, hitPoints: 40 },
  modifiers: [
    { source: { kind: "terrain" }, attackDelta: 0, hitPointsDelta: 10 },
    {
      source: { kind: "item", name: "レザーアーマー" },
      attackDelta: 0,
      hitPointsDelta: 25,
    },
  ],
  states: ["FIRST_STRIKE"],
  damages: [20],
  current: { attack: 30, hitPoints: 55 },
};

describe("battleStatLine", () => {
  it("戦闘の前の値から、出どころつきの増減と受けたダメージを積み上げ、今の値で締める", () => {
    assert.equal(
      battleStatLine(SIDE, "hitPoints"),
      "HP 40 +10 地形効果 +25 アイテム「レザーアーマー」 −20 = 55",
    );
  });

  it("増減もダメージも無ければ、戦闘の前の値だけ", () => {
    assert.equal(battleStatLine(SIDE, "attack"), "AT 30");
  });
});

describe("battleStatParts", () => {
  it("直前の発動で変わった増減と、その行の今の値だけに色が付く", () => {
    const parts = battleStatParts(
      SIDE,
      "hitPoints",
      { side: "DEFENDER", part: "modifier", index: 1 },
      "DEFENDER",
    );
    assert.deepEqual(
      parts.filter((part) => part.changed).map((part) => part.text),
      ["+25 アイテム「レザーアーマー」", "= 55"],
    );
  });

  it("もう片方の側の変化には色が付かない", () => {
    const parts = battleStatParts(
      SIDE,
      "hitPoints",
      { side: "DEFENDER", part: "damage", index: 0 },
      "ATTACKER",
    );
    assert.equal(
      parts.some((part) => part.changed),
      false,
    );
  });
});

describe("battleSideTitleParts", () => {
  it("名前と出したアイテムに、得た状態の印が続き、直前に得た状態に色が付く", () => {
    assert.deepEqual(
      battleSideTitleParts(
        SIDE,
        { side: "DEFENDER", part: "state", index: 0 },
        "DEFENDER",
      ),
      [
        { text: "コーンフォーク（レザーアーマー）", changed: false },
        { text: " ［先制］", changed: true },
      ],
    );
  });
});
