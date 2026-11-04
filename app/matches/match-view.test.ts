import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  currentTurnText,
  participantPieces,
  roundText,
  turnOrderNames,
} from "./match-view.ts";

const participants = [
  { turnOrder: 1, avatar: { name: "あ" }, position: { x: 0, y: 0 } },
  { turnOrder: 0, avatar: { name: "い" }, position: { x: 2, y: 1 } },
];

describe("roundText", () => {
  it("今のラウンドと上限を「ラウンド 1 / 30」の形で出す", () => {
    assert.equal(roundText(1, 30), "ラウンド 1 / 30");
  });
});

describe("turnOrderNames", () => {
  it("turnOrder の小さい順にアバター名を並べ、元の並びは変えない", () => {
    assert.deepEqual(turnOrderNames(participants), ["い", "あ"]);
    assert.equal(participants[0].avatar.name, "あ");
  });
});

describe("currentTurnText", () => {
  it("currentParticipant の席の参加者のアバター名を出す", () => {
    assert.equal(currentTurnText(participants, 1), "い");
  });

  it("順番が決まっていないとその旨を出す", () => {
    assert.equal(
      currentTurnText(participants, null),
      "順番はまだ決まっていません",
    );
  });
});

describe("participantPieces", () => {
  it("席の順に 1 始まりの番号を印にして、位置を引き継ぐ", () => {
    assert.deepEqual(participantPieces(participants), [
      { x: 0, y: 0, label: "1" },
      { x: 2, y: 1, label: "2" },
    ]);
  });
});
