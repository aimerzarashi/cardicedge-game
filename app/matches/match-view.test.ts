import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { participantColor } from "../boards/board-paint.ts";
import {
  currentTurnText,
  isMyTurn,
  isWatching,
  participantPieces,
  participantRows,
  reviewRows,
  roundText,
  territoryMarks,
  winnerNames,
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

describe("participantRows", () => {
  it("turnOrder の小さい順に並べ、席の添字・コマの番号・今の番かを持たせる", () => {
    assert.deepEqual(participantRows(participants, 1), [
      { seat: 1, piece: 2, isCurrent: true },
      { seat: 0, piece: 1, isCurrent: false },
    ]);
  });

  it("順番が決まっていないと今の番の行は無い", () => {
    assert.ok(participantRows(participants, null).every((r) => !r.isCurrent));
  });

  it("元の並びは変えない", () => {
    participantRows(participants, 0);
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
      { x: 0, y: 0, label: "1", color: participantColor(0) },
      { x: 2, y: 1, label: "2", color: participantColor(1) },
    ]);
  });
});

describe("isWatching", () => {
  it("参加者にログイン中のプレイヤーがいなければ見ているだけ", () => {
    assert.equal(
      isWatching([{ playerId: null }, { playerId: null }], "p1"),
      true,
    );
    assert.equal(
      isWatching([{ playerId: "p2" }, { playerId: null }], "p1"),
      true,
    );
  });

  it("参加者にログイン中のプレイヤーがいれば見ているだけではない", () => {
    assert.equal(
      isWatching([{ playerId: "p1" }, { playerId: null }], "p1"),
      false,
    );
  });
});

describe("isMyTurn", () => {
  const seats = [{ playerId: "p1" }, { playerId: null }];

  it("今の番の参加者がログイン中のプレイヤーなら自分の番", () => {
    assert.equal(isMyTurn(seats, 0, "p1"), true);
  });

  it("NPC の番や別のプレイヤーの番は自分の番ではない", () => {
    assert.equal(isMyTurn(seats, 1, "p1"), false);
    assert.equal(isMyTurn(seats, 0, "p2"), false);
  });

  it("順番が決まっていなければ自分の番ではない", () => {
    assert.equal(isMyTurn(seats, null, "p1"), false);
  });
});

describe("winnerNames", () => {
  it("勝った参加者のアバター名を、引き分けなら並べて出す", () => {
    assert.equal(winnerNames(participants, [1]), "い");
    assert.equal(winnerNames(participants, [0, 1]), "あ、い");
  });

  it("存在しない番号は飛ばす", () => {
    assert.equal(winnerNames(participants, [5, 0]), "あ");
  });
});

describe("reviewRows", () => {
  const reviewers = [
    {
      kind: "PLAYER",
      avatar: { name: "あ" },
      totalMagic: 100,
      rewardReceived: true,
      rewardCards: [{ name: "A" }, { name: "B" }],
    },
    {
      kind: "NPC",
      avatar: { name: "い" },
      totalMagic: 300,
      rewardReceived: false,
      rewardCards: [],
    },
    {
      kind: "PLAYER",
      avatar: { name: "う" },
      totalMagic: 300,
      rewardReceived: false,
      rewardCards: [],
    },
  ];

  it("core が返した順位の小さい順に並べ、同じ順位は席の順にして、順位は書き換えない", () => {
    const rows = reviewRows(reviewers, [3, 1, 1]);
    assert.deepEqual(
      rows.map((row) => [row.seat, row.rank]),
      [
        [1, 1],
        [2, 1],
        [0, 3],
      ],
    );
  });

  it("名前・魔力・プレイヤーか・受け取ったカードの名前を持たせる", () => {
    const [, , first] = reviewRows(reviewers, [3, 1, 1]);
    assert.deepEqual(first, {
      seat: 0,
      rank: 3,
      name: "あ",
      isPlayer: true,
      totalMagic: 100,
      rewardReceived: true,
      rewardCards: ["A", "B"],
    });
  });
});

describe("territoryMarks", () => {
  const territory = (owner: number, id: number, name: string, level = 1) => ({
    position: { x: owner, y: 0 },
    owner,
    level,
    toll: level * 60,
    creature: { id, hitPoints: 25, card: { name, attack: 30 } },
  });

  it("番号は core のクリーチャーの ID で、盤面から外れた番号は飛んだままにする", () => {
    assert.deepEqual(
      territoryMarks([
        territory(1, 1, "ウルフ"),
        territory(0, 3, "ゴーレム", 2),
      ]).map(({ number, level, toll, creature, attack, hitPoints, color }) => ({
        number,
        level,
        toll,
        creature,
        attack,
        hitPoints,
        color,
      })),
      [
        {
          number: 1,
          level: 1,
          toll: 60,
          creature: "ウルフ",
          attack: 30,
          hitPoints: 25,
          color: participantColor(1),
        },
        {
          number: 3,
          level: 2,
          toll: 120,
          creature: "ゴーレム",
          attack: 30,
          hitPoints: 25,
          color: participantColor(0),
        },
      ],
    );
  });
});
