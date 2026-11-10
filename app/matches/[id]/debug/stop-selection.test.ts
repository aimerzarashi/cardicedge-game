import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { choicesAt, selectableTerritories } from "./stop-selection.ts";

const A = { x: 1, y: 0 };
const B = { x: 2, y: 0 };
const choices = {
  levelUpChoices: [A, A, B],
  exchangeChoices: [B, B],
  elementChangeChoices: [A],
};

describe("selectableTerritories", () => {
  it("領地を選ぶ順番では、そのコマンドの選択肢の位置を重ねずに返す", () => {
    assert.deepEqual(
      selectableTerritories({ command: "levelUp", position: null }, choices),
      [A, B],
    );
    assert.deepEqual(
      selectableTerritories({ command: "exchange", position: null }, choices),
      [B],
    );
    assert.deepEqual(
      selectableTerritories(
        { command: "elementChange", position: null },
        choices,
      ),
      [A],
    );
  });

  it("領地を選んだ後は押せる領地が無い", () => {
    assert.deepEqual(
      selectableTerritories({ command: "levelUp", position: A }, choices),
      [],
    );
  });

  it("何も選んでいないときと、配置・侵略では押せる領地が無い", () => {
    assert.deepEqual(selectableTerritories(null, choices), []);
    assert.deepEqual(selectableTerritories({ command: "deploy" }, choices), []);
    assert.deepEqual(selectableTerritories({ command: "invade" }, choices), []);
  });
});

describe("choicesAt", () => {
  it("選んだ領地の選択肢だけを返す", () => {
    const levels = [
      { ...A, level: 2 },
      { ...A, level: 3 },
      { ...B, level: 2 },
    ];
    assert.deepEqual(
      choicesAt(levels, A).map((choice) => choice.level),
      [2, 3],
    );
  });
});
