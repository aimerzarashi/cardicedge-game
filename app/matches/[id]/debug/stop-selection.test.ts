import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  choicesAt,
  selectableTerritories,
  selectTile,
} from "./stop-selection.ts";

const A = { x: 1, y: 0 };
const B = { x: 2, y: 0 };
const choices = {
  levelUpChoices: [A, A, B],
  exchangeChoices: [B, B],
  elementChangeChoices: [A],
  moveChoices: [
    { ...A, to: B },
    { ...A, to: { x: 3, y: 0 } },
    { ...B, to: { x: 4, y: 0 } },
  ],
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

describe("移動の選び方", () => {
  it("動かす領地を選ぶ前は動かせる領地、選んだ後はそこから届く行き先が押せる", () => {
    assert.deepEqual(
      selectableTerritories(
        { command: "move", position: null, to: null },
        choices,
      ),
      [A, B],
    );
    assert.deepEqual(
      selectableTerritories(
        { command: "move", position: A, to: null },
        choices,
      ),
      [B, { x: 3, y: 0 }],
    );
    assert.deepEqual(
      selectableTerritories({ command: "move", position: A, to: B }, choices),
      [],
    );
  });

  it("盤面で押したマスは、1 回目が動かす領地、2 回目が行き先になる", () => {
    const first = selectTile({ command: "move", position: null, to: null }, A);
    assert.deepEqual(first, { command: "move", position: A, to: null });
    assert.deepEqual(selectTile(first, B), {
      command: "move",
      position: A,
      to: B,
    });
    assert.deepEqual(selectTile({ command: "levelUp", position: null }, B), {
      command: "levelUp",
      position: B,
    });
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
