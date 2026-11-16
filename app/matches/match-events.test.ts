import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chainChangesOf,
  eventLine,
  type MatchEventView,
  mergeShown,
  splitEvents,
} from "./match-events.ts";

const names = ["部屋用", "ゴリガン"];
const event = (
  revision: number,
  rest: Partial<MatchEventView> = {},
): MatchEventView => ({
  __typename: "MatchPieceMovedEvent",
  revision,
  ...rest,
});

describe("eventLine", () => {
  it("領地のレベルを上げたイベントは、位置・レベル・払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(30, {
          __typename: "MatchLandLeveledUpEvent",
          participant: 0,
          position: { x: 2, y: 0 },
          level: 3,
          magic: 300,
        }),
        names,
      ),
      "版 30 部屋用: 領地 (2, 0) をレベル 3 に上げた（魔力 -300）",
    );
  });

  it("土地の属性を変えたイベントは、位置・属性・払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(33, {
          __typename: "MatchLandElementChangedEvent",
          participant: 0,
          position: { x: 1, y: 0 },
          element: "WATER",
          magic: 200,
          baseLandValue: 100,
          multiplier: 2,
        }),
        names,
      ),
      "版 33 部屋用: 領地 (1, 0) の土地を水属性に変えた（魔力 -200。基本の値 100 × 2）",
    );
  });

  it("周回を終えたイベントは、合計の後に、基本の額と領地の分の額の内訳を出す", () => {
    assert.equal(
      eventLine(
        event(35, {
          __typename: "MatchLapCompletedEvent",
          participant: 0,
          magic: 380,
          lapBonus: 300,
          territoryBonus: 80,
          territoryCount: 4,
          lapBonusPerTerritory: 20,
        }),
        names,
      ),
      "版 35 部屋用: 周回を終えた（周回のボーナス 380: 基本 300 ＋ 領地 80（4 つ × 20））",
    );
  });

  it("援護に出したイベントは、出したクリーチャーと払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(37, {
          __typename: "MatchCreatureUsedAsItemEvent",
          participant: 0,
          card: { name: "ウッドフォーク" },
          cost: 50,
        }),
        names,
      ),
      "版 37 部屋用: クリーチャー「ウッドフォーク」を援護に出した（魔力 -50）",
    );
  });

  it("周回回復のイベントは、位置・カード・回復した量と、回復の前後の HP を出す", () => {
    assert.equal(
      eventLine(
        event(36, {
          __typename: "MatchLapCreatureHitPointsRecoveredEvent",
          participant: 0,
          position: { x: 2, y: 0 },
          card: { name: "ウルフ" },
          amount: 10,
          hitPoints: 20,
        }),
        names,
      ),
      "版 36 部屋用: (2, 0) のクリーチャー「ウルフ」の HP が周回回復で 10 回復した（10 → 20）",
    );
  });

  it("動かしたイベントと、移動で侵略したイベントを出す", () => {
    assert.equal(
      eventLine(
        event(34, {
          __typename: "MatchCreatureMovedEvent",
          participant: 0,
          from: { x: 1, y: 0 },
          to: { x: 2, y: 0 },
        }),
        names,
      ),
      "版 34 部屋用: (1, 0) のクリーチャーを (2, 0) へ動かした",
    );
    assert.equal(
      eventLine(
        event(35, {
          __typename: "MatchTerritoryInvadedByMoveEvent",
          participant: 0,
          from: { x: 1, y: 0 },
          position: { x: 2, y: 0 },
          card: { name: "ウルフ" },
          defendingCreatureCard: { name: "ゴブリン" },
        }),
        names,
      ),
      "版 35 部屋用: クリーチャー「ウルフ」が (1, 0) からクリーチャー「ゴブリン」が守る領地 (2, 0) を侵略した",
    );
  });

  it("侵略したイベントは、出したクリーチャーと守るクリーチャーの名前・位置・払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(36, {
          __typename: "MatchTerritoryInvadedEvent",
          participant: 1,
          card: { name: "ウルフ" },
          defendingCreatureCard: { name: "ゴブリン" },
          position: { x: 2, y: 0 },
          cost: 10,
        }),
        names,
      ),
      "版 36 ゴリガン: クリーチャー「ウルフ」でクリーチャー「ゴブリン」が守る領地 (2, 0) を侵略した（魔力 -10）",
    );
  });

  // 倒れたことは直前の破壊の行に出るので、失敗の行は戻った先だけを添える（core#181）
  // 破壊されたときの効果は持ち主に発動し、結果は手札に戻った・魔力を受け取ったで出す（core#182）
  it("破壊されたときの効果の発動と結果は、持ち主とカードの名前で出す", () => {
    const line = (fields: Record<string, unknown>) =>
      eventLine(event(40, { participant: 1, owner: 0, ...fields }), names);
    assert.equal(
      line({
        __typename: "MatchDestructionCreatureEffectActivatedEvent",
        card: { name: "フェニックス" },
        activatedEffect: { kind: "RETURN_TO_HAND_ON_DESTRUCTION" },
      }),
      "版 40 ゴリガン: 部屋用にクリーチャー「フェニックス」の効果「破壊されたら手札に戻る」が発動",
    );
    assert.equal(
      line({
        __typename: "MatchDestructionCreatureEffectActivatedEvent",
        card: { name: "コーンフォーク" },
        activatedEffect: { kind: "GAIN_MAGIC_ON_DESTRUCTION", amount: 200 },
      }),
      "版 40 ゴリガン: 部屋用にクリーチャー「コーンフォーク」の効果「破壊されたら魔力を得る」が発動（魔力 +200）",
    );
    assert.equal(
      line({
        __typename: "MatchCardReturnedToHandEvent",
        card: { name: "フェニックス" },
      }),
      "版 40 ゴリガン: 「フェニックス」が部屋用の手札に戻った",
    );
    assert.equal(
      line({ __typename: "MatchMagicReceivedEvent", magic: 200 }),
      "版 40 ゴリガン: 部屋用が魔力 200 を受け取った",
    );
  });

  it("侵略に失敗したイベントは、生き残れば手札か元の領地に戻ったことを出し、倒れていれば失敗だけを出す", () => {
    const failed = (
      returnedToHand: boolean,
      returnedTo: { x: number; y: number } | null,
    ) =>
      eventLine(
        event(36, {
          __typename: "MatchInvasionFailedEvent",
          participant: 0,
          card: { name: "ナイト" },
          returnedToHand,
          returnedTo,
        }),
        names,
      );
    assert.equal(
      failed(true, null),
      "版 36 部屋用: 侵略に失敗した（「ナイト」は手札に戻った）",
    );
    assert.equal(
      failed(false, { x: 1, y: 0 }),
      "版 36 部屋用: 侵略に失敗した（「ナイト」は元の領地に戻った）",
    );
    assert.equal(failed(false, null), "版 36 部屋用: 侵略に失敗した");
  });

  it("破壊のイベントは、イベントと同じ言葉で破壊されたクリーチャーを出し、侵略の成功は奪った領地を出す", () => {
    const line = (fields: Record<string, unknown>) =>
      eventLine(event(37, { participant: 0, ...fields }), names);
    assert.equal(
      line({
        __typename: "MatchInvadingCreatureDestroyedEvent",
        card: { name: "ナイト" },
        position: { x: 2, y: 0 },
      }),
      "版 37 部屋用: 侵略したクリーチャー「ナイト」が破壊された",
    );
    assert.equal(
      line({
        __typename: "MatchDefendingCreatureDestroyedEvent",
        card: { name: "ゴブリン" },
        position: { x: 2, y: 0 },
      }),
      "版 37 部屋用: 守るクリーチャー「ゴブリン」が破壊された",
    );
    assert.equal(
      line({
        __typename: "MatchInvasionSucceededEvent",
        position: { x: 2, y: 0 },
      }),
      "版 37 部屋用: 侵略に成功した（(2, 0) を奪った）",
    );
  });

  it("交換したイベントは、位置・元のカード・出したカード・払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(32, {
          __typename: "MatchCreatureExchangedEvent",
          participant: 0,
          position: { x: 1, y: 0 },
          card: { name: "ナイト" },
          returnedCard: { name: "ゴブリン" },
          cost: 40,
        }),
        names,
      ),
      "版 32 部屋用: 領地 (1, 0) の「ゴブリン」を「ナイト」に交換した（魔力 -40）",
    );
  });

  it("戦闘の始まりは、両方の効果を当てる前の AT・HP を出す", () => {
    assert.equal(
      eventLine(
        event(20, {
          __typename: "MatchBattleStartedEvent",
          attacker: { attack: 30, hitPoints: 40 },
          defender: { attack: 20, hitPoints: 35 },
        }),
        names,
      ),
      "版 20 戦闘が始まった（攻める側 AT 30・HP 40、守る側 AT 20・HP 35）",
    );
  });

  // 発動のイベントは出どころごとに種類が分かれ、増減と当てた後の値を change に持つ（core#175・game#98）
  for (const [name, fields, line, change] of [
    [
      "支援効果",
      {
        __typename: "MatchBattleSupportEffectActivatedEvent",
        side: "ATTACKER",
        positions: [
          { x: 1, y: 0 },
          { x: 3, y: 0 },
        ],
        bonusPerTerritory: 10,
      },
      "攻める側に支援効果（隣の領地 2 つ × AT +10）: AT +20 → AT 50・HP 40",
      { attackDelta: 20, hitPointsDelta: 0, attack: 50, hitPoints: 40 },
    ],
    // 支援効果は守る側にも付く（core#178）
    [
      "守る側の支援効果",
      {
        __typename: "MatchBattleSupportEffectActivatedEvent",
        side: "DEFENDER",
        positions: [{ x: 2, y: 1 }],
        bonusPerTerritory: 10,
      },
      "守る側に支援効果（隣の領地 1 つ × AT +10）: AT +10 → AT 30・HP 40",
      { attackDelta: 10, hitPointsDelta: 0, attack: 30, hitPoints: 40 },
    ],
    [
      "地形効果",
      {
        __typename: "MatchBattleTerrainEffectActivatedEvent",
        side: "DEFENDER",
        element: "FIRE",
        level: 2,
        bonusPerLevel: 10,
      },
      "守る側に地形効果（火属性 レベル 2 × HP +10）: HP +20 → AT 20・HP 60",
      { attackDelta: 0, hitPointsDelta: 20, attack: 20, hitPoints: 60 },
    ],
    [
      "アイテムの HP の増減で HP が 0（下限で止まった）",
      {
        __typename: "MatchBattleItemEffectActivatedEvent",
        side: "ATTACKER",
        card: { name: "呪いの指輪" },
        activatedEffect: { kind: "HIT_POINTS_MODIFIER", value: -99 },
      },
      "攻める側にアイテム「呪いの指輪」の効果「HP の増減」が発動（HP -99（-40 で止まった） → AT 30・HP 0（破壊された））",
      { attackDelta: 0, hitPointsDelta: -40, attack: 30, hitPoints: 0 },
    ],
    [
      "アイテムの AT の上書き",
      {
        __typename: "MatchBattleItemEffectActivatedEvent",
        side: "ATTACKER",
        card: { name: "アクアブラスト" },
        activatedEffect: { kind: "ATTACK_OVERRIDE", minimum: 30, maximum: 30 },
      },
      "攻める側にアイテム「アクアブラスト」の効果「AT の上書き」が発動（AT を 30 に: AT +10 → AT 30・HP 40）",
      { attackDelta: 10, hitPointsDelta: 0, attack: 30, hitPoints: 40 },
    ],
    [
      "アイテムの強打",
      {
        __typename: "MatchBattleItemEffectActivatedEvent",
        side: "DEFENDER",
        card: { name: "ファイアダガー" },
        activatedEffect: { kind: "ATTACK_MULTIPLIER", percent: 150 },
      },
      "守る側にアイテム「ファイアダガー」の効果「強打」が発動（150%: AT +17 → AT 52・HP 40）",
      { attackDelta: 17, hitPointsDelta: 0, attack: 52, hitPoints: 40 },
    ],
    [
      "クリーチャーの HP の増減（アイテムと同じ書き方。core#178）",
      {
        __typename: "MatchBattleCreatureEffectActivatedEvent",
        side: "DEFENDER",
        card: { name: "アイスウォール" },
        activatedEffect: { kind: "HIT_POINTS_MODIFIER", value: 20 },
      },
      "守る側にクリーチャー「アイスウォール」の効果「HP の増減」が発動（HP +20 → AT 10・HP 80）",
      { attackDelta: 0, hitPointsDelta: 20, attack: 10, hitPoints: 80 },
    ],
    [
      "増減が 0 のクリーチャーの効果",
      {
        __typename: "MatchBattleCreatureEffectActivatedEvent",
        side: "ATTACKER",
        card: { name: "ゴブリン" },
        activatedEffect: { kind: "ATTACK_MODIFIER", value: 0 },
      },
      "攻める側にクリーチャー「ゴブリン」の効果「AT の増減」が発動（増減なし → AT 20・HP 30）",
      { attackDelta: 0, hitPointsDelta: 0, attack: 20, hitPoints: 30 },
    ],
    [
      "AT が 0 で変わらなかったクリーチャーの効果",
      {
        __typename: "MatchBattleCreatureEffectActivatedEvent",
        side: "ATTACKER",
        card: { name: "ゴブリン" },
        activatedEffect: { kind: "ATTACK_MODIFIER", value: -10 },
      },
      "攻める側にクリーチャー「ゴブリン」の効果「AT の増減」が発動（AT -10（変わらず） → AT 0・HP 30）",
      { attackDelta: 0, hitPointsDelta: 0, attack: 0, hitPoints: 30 },
    ],
    [
      "援護（出したクリーチャーのカードの AT・HP を足す。core#114）",
      {
        __typename: "MatchBattleCreatureEffectActivatedEvent",
        side: "ATTACKER",
        card: { name: "ウッドフォーク" },
        activatedEffect: {
          kind: "USE_CREATURE_AS_ITEM",
          elements: ["FIRE", "EARTH", "WATER", "WIND", "NEUTRAL"],
        },
      },
      "攻める側にクリーチャー「ウッドフォーク」の効果「援護」が発動（AT +20・HP +40 → AT 50・HP 70）",
      { attackDelta: 20, hitPointsDelta: 40, attack: 50, hitPoints: 70 },
    ],
    [
      "クリーチャーの上書き（範囲と、変えた差・値を出す）",
      {
        __typename: "MatchBattleCreatureEffectActivatedEvent",
        side: "DEFENDER",
        card: { name: "スペクター" },
        activatedEffect: {
          kind: "HIT_POINTS_OVERRIDE",
          minimum: 10,
          maximum: 70,
        },
      },
      "守る側にクリーチャー「スペクター」の効果「HP の上書き」が発動（HP を 10〜70 に: HP -10 → AT 30・HP 20）",
      { attackDelta: 0, hitPointsDelta: -10, attack: 30, hitPoints: 20 },
    ],
    [
      "クリーチャーの上書きで値が変わらない",
      {
        __typename: "MatchBattleCreatureEffectActivatedEvent",
        side: "ATTACKER",
        card: { name: "スペクター" },
        activatedEffect: { kind: "ATTACK_OVERRIDE", minimum: 10, maximum: 70 },
      },
      "攻める側にクリーチャー「スペクター」の効果「AT の上書き」が発動（AT を 10〜70 に: 増減なし → AT 20・HP 30）",
      { attackDelta: 0, hitPointsDelta: 0, attack: 20, hitPoints: 30 },
    ],
  ] as const) {
    it(`発動のイベントは、${name}の増減と当てた後の値を出す`, () => {
      assert.equal(
        eventLine(
          event(21, { ...(fields as Partial<MatchEventView>), change }),
          names,
        ),
        `版 21 ${line}`,
      );
    });
  }

  it("地形効果を無視するのイベントは、相手の HP が地形効果の分を除いた値になることを出す", () => {
    assert.equal(
      eventLine(
        event(22, {
          __typename: "MatchBattleItemEffectActivatedEvent",
          side: "ATTACKER",
          card: { name: "ストーンバレット" },
          activatedEffect: { kind: "IGNORE_TERRAIN_EFFECT" },
          change: null,
          opponentChange: {
            attackDelta: 0,
            hitPointsDelta: -20,
            attack: 10,
            hitPoints: 40,
          },
        }),
        names,
      ),
      "版 22 攻める側にアイテム「ストーンバレット」の効果「地形効果を無視する」が発動（守る側の地形効果の分を除く: HP -20 → AT 10・HP 40）",
    );
  });

  it("AT・HP を変えないクリーチャーの効果の発動は、どちらの側のどのクリーチャーの何の効果かだけを出す", () => {
    assert.equal(
      eventLine(
        event(22, {
          __typename: "MatchBattleCreatureEffectActivatedEvent",
          side: "DEFENDER",
          card: { name: "ドラゴンフライ" },
          activatedEffect: { kind: "STRIKE_FIRST" },
          change: null,
        }),
        names,
      ),
      "版 22 守る側にクリーチャー「ドラゴンフライ」の効果「先制」が発動",
    );
    assert.equal(
      eventLine(
        event(23, {
          __typename: "MatchBattleCreatureEffectActivatedEvent",
          side: "DEFENDER",
          card: { name: "ジャイアントアメーバ" },
          activatedEffect: { kind: "NULLIFY_RECEIVED_DAMAGE" },
          change: null,
        }),
        names,
      ),
      "版 23 守る側にクリーチャー「ジャイアントアメーバ」の効果「攻撃無効」が発動",
    );
  });

  it("攻撃のイベントは、攻撃の値と相手が受けた量を分けて出す", () => {
    assert.equal(
      eventLine(
        event(24, {
          __typename: "MatchCreatureStruckEvent",
          striker: "ATTACKER",
          attack: 50,
          damage: 0,
          remainingHitPoints: 30,
        }),
        names,
      ),
      "版 24 攻める側の攻撃 50 → 守る側のダメージ 0（残りの HP 30）",
    );
    assert.equal(
      eventLine(
        event(25, {
          __typename: "MatchCreatureStruckEvent",
          striker: "DEFENDER",
          attack: 30,
          damage: 30,
          remainingHitPoints: 0,
        }),
        names,
      ),
      "版 25 守る側の攻撃 30 → 攻める側のダメージ 30（残りの HP 0）",
    );
  });

  it("進んだイベントは、版・アバターの名前・行き先を出す", () => {
    assert.equal(
      eventLine(event(15, { participant: 1, to: { x: 1, y: 0 } }), names),
      "版 15 ゴリガン: (1, 0) へ進んだ",
    );
  });

  it("配置したイベントは、クリーチャーの名前・位置・払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(17, {
          __typename: "MatchCreaturePlacedEvent",
          participant: 0,
          card: { name: "ウルフ" },
          position: { x: 1, y: 0 },
          cost: 10,
        }),
        names,
      ),
      "版 17 部屋用: クリーチャー「ウルフ」を (1, 0) に配置した（魔力 -10）",
    );
  });

  it("手札が上限を超えたイベントは、捨てる枚数と手札・上限の枚数を出す", () => {
    assert.equal(
      eventLine(
        event(40, {
          __typename: "MatchHandLimitExceededEvent",
          participant: 1,
          handCount: 8,
          maxHandCards: 6,
        }),
        names,
      ),
      "版 40 ゴリガン: 手札が上限を超えたので、ターンを終える前に 2 枚捨てる（手札 8 枚・上限 6 枚）",
    );
  });

  it("魔力を得たイベントを出す", () => {
    assert.equal(
      eventLine(
        event(19, {
          __typename: "MatchMagicGainedEvent",
          participant: 0,
          magic: 600,
          laps: 2,
          magicPerLap: 200,
        }),
        names,
      ),
      "版 19 部屋用: 魔力を得た（魔力 +600。（周回 2 回 + 1）× 200）",
    );
  });

  it("ターンをまたいで効き続けるスペルは、使ったときに対象の名前と効き方・ターン数で発動を出し、振るときは効いた効果を添える", () => {
    const fixedDice = {
      __typename: "FixedDiceSpellEffect",
      value: 6,
      turns: 3,
    };
    const multipleDice = {
      __typename: "MultipleDiceSpellEffect",
      count: 2,
      turns: 3,
    };
    assert.equal(
      eventLine(
        event(22, {
          __typename: "MatchSpellEffectStartedEvent",
          participant: 0,
          target: 1,
          effect: { remainingTurns: 3, effect: fixedDice },
        }),
        names,
      ),
      `版 22 部屋用: ${names[1]}にスペル「サイコロの目を固定する」が発動（目 6・3 ターン）`,
    );
    assert.equal(
      eventLine(
        event(22, {
          __typename: "MatchSpellEffectStartedEvent",
          participant: 0,
          target: 1,
          effect: { remainingTurns: 3, effect: multipleDice },
        }),
        names,
      ),
      `版 22 部屋用: ${names[1]}にスペル「サイコロを複数振る」が発動（2 個・3 ターン）`,
    );
    assert.equal(
      eventLine(
        event(23, {
          __typename: "MatchDiceRolledEvent",
          participant: 0,
          value: 6,
          dice: [],
          spellEffect: fixedDice,
        }),
        names,
      ),
      "版 23 部屋用: サイコロ 6（スペル「サイコロの目を固定する」の効果）",
    );
    assert.equal(
      eventLine(
        event(23, {
          __typename: "MatchDiceRolledEvent",
          participant: 0,
          value: 8,
          dice: [3, 5],
          spellEffect: multipleDice,
        }),
        names,
      ),
      "版 23 部屋用: サイコロ 3 + 5 = 8（スペル「サイコロを複数振る」の効果）",
    );
    assert.equal(
      eventLine(
        event(24, { __typename: "MatchSpellEffectEndedEvent", participant: 0 }),
        names,
      ),
      "版 24 部屋用: 続いていたスペルの効果が終わった",
    );
  });

  it("ダメージと破壊のイベントは、位置とダメージ・残りの HP を出す", () => {
    assert.equal(
      eventLine(
        event(25, {
          __typename: "MatchSpellCreatureDamagedEvent",
          participant: 0,
          position: { x: 1, y: 0 },
          damage: 20,
          remainingHitPoints: 10,
        }),
        names,
      ),
      "版 25 部屋用: (1, 0) のクリーチャーに 20 ダメージ（残りの HP 10）",
    );
    assert.equal(
      eventLine(
        event(26, {
          __typename: "MatchBoardCreatureDestroyedEvent",
          participant: 0,
          card: { name: "ゴブリン" },
          position: { x: 1, y: 0 },
        }),
        names,
      ),
      "版 26 部屋用: (1, 0) のクリーチャー「ゴブリン」が破壊された",
    );
  });

  it("複数のサイコロを振ったイベントは、1 個ずつの目と合計を出す", () => {
    assert.equal(
      eventLine(
        event(21, {
          __typename: "MatchDiceRolledEvent",
          participant: 0,
          value: 8,
          dice: [3, 5],
        }),
        names,
      ),
      "版 21 部屋用: サイコロ 3 + 5 = 8",
    );
  });

  it("スペルを使ったイベントは、スペルの名前と払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(18, {
          __typename: "MatchSpellUsedEvent",
          participant: 0,
          card: { name: "ホープ" },
          cost: 40,
        }),
        names,
      ),
      "版 18 部屋用: スペル「ホープ」を使った（魔力 -40）",
    );
  });

  it("通行料は、受け取った人の名前・位置・払った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(18, {
          __typename: "MatchTollPaidEvent",
          participant: 0,
          owner: 1,
          position: { x: 1, y: 0 },
          magic: 60,
        }),
        names,
      ),
      "版 18 部屋用: ゴリガンの領地 (1, 0) に通行料を払った（魔力 -60）",
    );
  });

  it("通行料の倍率の発動は、位置・倍率・盤面の通行料と払う額を出す", () => {
    assert.equal(
      eventLine(
        event(17, {
          __typename: "MatchTollCreatureEffectActivatedEvent",
          position: { x: 1, y: 0 },
          percent: 150,
          toll: 60,
          multipliedToll: 90,
        }),
        names,
      ),
      "版 17 (1, 0) に効果「通行料の倍率」が発動（150%: 通行料 60 → 90）",
    );
  });

  it("領地を手放したイベントは、位置と受け取った魔力を出す", () => {
    assert.equal(
      eventLine(
        event(19, {
          __typename: "MatchTerritoryRelinquishedEvent",
          participant: 0,
          position: { x: 2, y: 0 },
          magic: 80,
        }),
        names,
      ),
      "版 19 部屋用: 領地 (2, 0) を手放した（魔力 +80）",
    );
  });

  it("魔力の枯渇は、与えられた魔力を出す", () => {
    assert.equal(
      eventLine(
        event(20, {
          __typename: "MatchMagicDepletedEvent",
          participant: 0,
          magic: 600,
        }),
        names,
      ),
      "版 20 部屋用: 魔力が枯渇し、拠点からやり直す（魔力 600）",
    );
  });

  it("チェックポイントは位置と増えた魔力を出す", () => {
    assert.equal(
      eventLine(
        event(16, {
          __typename: "MatchCheckpointPassedEvent",
          participant: 1,
          checkpoint: { x: 2, y: 2 },
          magic: 100,
        }),
        names,
      ),
      "版 16 ゴリガン: チェックポイント (2, 2) を通った（魔力 +100）",
    );
  });

  it("サイコロの目を出す", () => {
    assert.equal(
      eventLine(
        event(12, {
          __typename: "MatchDiceRolledEvent",
          participant: 0,
          value: 3,
        }),
        names,
      ),
      "版 12 部屋用: サイコロ 3",
    );
  });

  it("誰も起こしていないイベントは、名前を付けない", () => {
    assert.equal(
      eventLine(event(1, { __typename: "MatchCreatedEvent" }), names),
      "版 1 対戦が始まった",
    );
  });

  it("順番と勝った人は、参加者の番号を名前にして出す", () => {
    assert.equal(
      eventLine(
        event(2, { __typename: "MatchTurnOrderDecidedEvent", order: [1, 0] }),
        names,
      ),
      "版 2 順番が決まった: ゴリガン → 部屋用",
    );
    assert.equal(
      eventLine(
        event(40, {
          __typename: "MatchEndedEvent",
          winners: [0, 1],
          reason: "ROUND_LIMIT",
        }),
        names,
      ),
      "版 40 対戦が終わった（勝った人: 部屋用、ゴリガン。ラウンドの上限に達した）",
    );
  });

  it("戦利品のイベントは、引いたカードの名前と、全員が受け取ったことを出す", () => {
    assert.equal(
      eventLine(
        event(41, {
          __typename: "MatchRewardDrawnEvent",
          participant: 0,
          rewardCards: [{ name: "A" }, { name: "B" }],
        }),
        names,
      ),
      "版 41 部屋用: 戦利品を引いた（A、B）",
    );
    assert.equal(
      eventLine(
        event(42, { __typename: "MatchAllRewardsReceivedEvent" }),
        names,
      ),
      "版 42 全員が戦利品を受け取った",
    );
  });

  it("知らない種類でも落とさずに 1 行を出す", () => {
    assert.match(
      eventLine(event(3, { __typename: "MatchFutureEvent" }), names),
      /^版 3 /,
    );
  });
});

describe("splitEvents", () => {
  it("開いた時点の版までは欄に入れるだけ、それより後を順に描画する", () => {
    const events = [event(3), event(4), event(5)];
    const { silent, play } = splitEvents(events, 4);
    assert.deepEqual(
      silent.map((e) => e.revision),
      [3, 4],
    );
    assert.deepEqual(
      play.map((e) => e.revision),
      [5],
    );
  });
});

describe("mergeShown", () => {
  it("同じ版のイベントは 1 つだけにする", () => {
    const merged = mergeShown([event(1), event(2)], [event(2), event(3)]);
    assert.deepEqual(
      merged.map((e) => e.revision),
      [1, 2, 3],
    );
  });
});

describe("chainChangesOf", () => {
  const value = (
    x: number,
    chainCount: number,
    previousChainCount: number | null,
  ) => ({ position: { x, y: 0 }, chainCount, previousChainCount });

  it("前と今の連鎖の数が違う領地を増減にし、前が無い領地は 1 から入ったと読む", () => {
    assert.deepEqual(
      chainChangesOf({
        changes: {
          territoryValues: [
            value(1, 2, 1),
            value(2, 2, null),
            value(3, 1, null),
          ],
        },
      }),
      [
        { position: { x: 1, y: 0 }, from: 1, to: 2 },
        { position: { x: 2, y: 0 }, from: 1, to: 2 },
      ],
    );
  });

  it("連鎖の倍率が上限でも、連鎖の数が変われば増減にする", () => {
    assert.deepEqual(
      chainChangesOf({ changes: { territoryValues: [value(1, 6, 5)] } }),
      [{ position: { x: 1, y: 0 }, from: 5, to: 6 }],
    );
  });
});

describe("eventLine の連鎖の増減", () => {
  it("行の後ろに、同じ「前 → 後」の領地をまとめて連鎖の増減を添える", () => {
    assert.equal(
      eventLine(
        event(9, { __typename: "MatchTurnEndedEvent", participant: 0 }),
        names,
        [
          { position: { x: 4, y: 4 }, from: 1, to: 2 },
          { position: { x: 0, y: 5 }, from: 4, to: 3 },
          { position: { x: 2, y: 0 }, from: 4, to: 3 },
        ],
      ),
      "版 9 部屋用: ターンを終えた（連鎖 1 → 2: (4, 4)。連鎖 4 → 3: (0, 5)・(2, 0)）",
    );
  });
});
