import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  choicesAt,
  previewedTiles,
  selectableTerritories,
  selectTile,
  territoryCommandPositions,
  territoryCommandsAt,
} from "./stop-selection.ts";

const A = { x: 1, y: 0 };
const B = { x: 2, y: 0 };
const C = { x: 5, y: 0 };
// 止まったマス
const S = { x: 0, y: 0 };
const choices = {
  levelUpChoices: [A, A, B],
  exchangeChoices: [B, B],
  elementChangeChoices: [A],
  moveChoices: [
    { ...A, to: B },
    { ...A, to: { x: 3, y: 0 } },
    { ...C, to: { x: 4, y: 0 } },
  ],
  spellChoices: [
    { handIndex: 0, targetPositions: [] },
    { handIndex: 2, targetPositions: [A, B] },
  ],
};
const territory = {
  command: "territory",
  position: null,
  action: null,
  to: null,
} as const;

describe("領地コマンドを使える領地", () => {
  it("4 種類の領地コマンドのどれかを使える領地を、重ねずに返す", () => {
    assert.deepEqual(territoryCommandPositions(choices), [A, B, C]);
  });

  it("領地を選ぶと、その領地で使える領地コマンドだけを並べる", () => {
    assert.deepEqual(territoryCommandsAt(choices, A), [
      "levelUp",
      "elementChange",
      "move",
    ]);
    assert.deepEqual(territoryCommandsAt(choices, B), ["levelUp", "exchange"]);
    assert.deepEqual(territoryCommandsAt(choices, C), ["move"]);
  });
});

describe("selectableTerritories", () => {
  it("領地コマンドを選んだ直後は、使える領地が押せる", () => {
    assert.deepEqual(selectableTerritories(territory, choices), [A, B, C]);
  });

  it("領地を選んだ後は押せる領地が無く、選んだ領地にだけ見るだけの印が残る", () => {
    assert.deepEqual(
      selectableTerritories({ ...territory, position: A }, choices),
      [],
    );
    assert.deepEqual(
      selectableTerritories(
        { ...territory, position: A, action: "levelUp" },
        choices,
      ),
      [],
    );
    assert.deepEqual(previewedTiles({ ...territory, position: A }, S), [A]);
    assert.deepEqual(
      previewedTiles({ ...territory, position: A, action: "levelUp" }, S),
      [A],
    );
  });

  it("何も選んでいないときと、配置・侵略では押せる領地が無い", () => {
    assert.deepEqual(selectableTerritories(null, choices), []);
    assert.deepEqual(selectableTerritories({ command: "deploy" }, choices), []);
    assert.deepEqual(selectableTerritories({ command: "invade" }, choices), []);
  });

  it("配置・侵略を選んでいる間は、止まったマスに見るだけの印が残る", () => {
    assert.deepEqual(previewedTiles({ command: "deploy" }, S), [S]);
    assert.deepEqual(previewedTiles({ command: "invade" }, S), [S]);
    assert.deepEqual(previewedTiles(null, S), []);
  });
});

describe("移動の選び方", () => {
  it("移動を選ぶと、その領地から届く行き先が押せ、行き先を選んだ後は押せない", () => {
    const move = { ...territory, position: A, action: "move" } as const;
    assert.deepEqual(selectableTerritories(move, choices), [B, { x: 3, y: 0 }]);
    assert.deepEqual(selectableTerritories({ ...move, to: B }, choices), []);
    // 選んだ領地（と選んだ行き先）にだけ見るだけの印が残る
    assert.deepEqual(previewedTiles(move, S), [A]);
    assert.deepEqual(previewedTiles({ ...move, to: B }, S), [A, B]);
  });

  it("盤面で押したマスは、1 回目が領地、移動を選んだ後は行き先になる", () => {
    const chosen = selectTile(territory, A);
    assert.deepEqual(chosen, { ...territory, position: A });
    // 領地を選んだ後は押せるマスが無いので、押しても変わらない
    assert.deepEqual(selectTile(chosen, B), chosen);
    assert.deepEqual(
      selectTile({ ...territory, position: A, action: "move" }, B),
      { ...territory, position: A, action: "move", to: B },
    );
  });
});

describe("スペルの選び方", () => {
  it("クリーチャーを対象にするスペルは、そのスペルの対象の領地が押せ、押すと対象になる", () => {
    const chosen = { command: "spell", handIndex: 2, position: null } as const;
    assert.deepEqual(selectableTerritories(chosen, choices), [A, B]);
    const targeted = selectTile(chosen, B);
    assert.deepEqual(targeted, { command: "spell", handIndex: 2, position: B });
    // 押した後は押せる印が無く、押したマスにだけ見るだけの印が残る
    assert.deepEqual(selectableTerritories(targeted, choices), []);
    assert.deepEqual(previewedTiles(targeted, S), [B]);
  });

  it("クリーチャーを対象にしないスペルでは押せる領地が無い", () => {
    assert.deepEqual(
      selectableTerritories(
        { command: "spell", handIndex: 0, position: null },
        choices,
      ),
      [],
    );
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
