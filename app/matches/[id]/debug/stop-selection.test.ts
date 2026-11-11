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

  it("領地を選んだ後も、領地コマンドを選んでいる間は使える領地が押せる", () => {
    assert.deepEqual(
      selectableTerritories({ ...territory, position: A }, choices),
      [A, B, C],
    );
    assert.deepEqual(
      selectableTerritories(
        { ...territory, position: A, action: "levelUp" },
        choices,
      ),
      [A, B, C],
    );
    assert.deepEqual(
      previewedTiles({ ...territory, position: A }, choices, S),
      [],
    );
  });

  it("何も選んでいないときと、配置・侵略では押せる領地が無い", () => {
    assert.deepEqual(selectableTerritories(null, choices), []);
    assert.deepEqual(selectableTerritories({ command: "deploy" }, choices), []);
    assert.deepEqual(selectableTerritories({ command: "invade" }, choices), []);
  });

  it("配置・侵略を選んでいる間は、止まったマスに見るだけの印が残る", () => {
    assert.deepEqual(previewedTiles({ command: "deploy" }, choices, S), [S]);
    assert.deepEqual(previewedTiles({ command: "invade" }, choices, S), [S]);
    assert.deepEqual(previewedTiles(null, choices, S), []);
  });
});

describe("移動の選び方", () => {
  it("移動を選ぶと、その領地から届く行き先が押せ、行き先を選んだ後は押せない", () => {
    const move = { ...territory, position: A, action: "move" } as const;
    assert.deepEqual(selectableTerritories(move, choices), [B, { x: 3, y: 0 }]);
    assert.deepEqual(selectableTerritories({ ...move, to: B }, choices), []);
    // 行き先と見分けられるよう、使える領地は見るだけの印になる
    assert.deepEqual(previewedTiles(move, choices, S), [A, B, C]);
    assert.deepEqual(previewedTiles({ ...move, to: B }, choices, S), [A, B, C]);
  });

  it("盤面で押したマスは、領地コマンドでは選ぶ領地、移動を選んだ後は行き先になる", () => {
    const chosen = selectTile(territory, A);
    assert.deepEqual(chosen, { ...territory, position: A });
    // 別の領地を押すと、領地コマンドを選び直す
    assert.deepEqual(selectTile(chosen, B), { ...territory, position: B });
    assert.deepEqual(
      selectTile({ ...territory, position: A, action: "levelUp" }, C),
      { ...territory, position: C },
    );
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
    // 押した後も印が残り、別の対象を押すと選び直す
    assert.deepEqual(selectableTerritories(targeted, choices), [A, B]);
    assert.deepEqual(selectTile(targeted, A), {
      command: "spell",
      handIndex: 2,
      position: A,
    });
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
