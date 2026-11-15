import {
  BATTLE_VIEW_MESSAGES,
  CREATURE_ABILITY_LABELS,
} from "../../../messages.ts";
import type {
  FrameBattleHighlight,
  FrameBattleModifier,
  FrameBattleSide,
} from "./match-frame.ts";

const m = BATTLE_VIEW_MESSAGES;

function sourceLabel(source: FrameBattleModifier["source"]): string {
  switch (source.kind) {
    case "support":
      return m.supportSource;
    case "terrain":
      return m.terrainSource;
    case "item":
      return m.itemSource(source.name, source.effect);
    case "ability":
      return m.abilitySource(CREATURE_ABILITY_LABELS[source.ability]);
  }
}

function signed(value: number): string {
  return value < 0 ? `−${-value}` : `+${value}`;
}

// 1 行の部品。changed は直前のイベントで変わった所（画面で色を変える）
export type BattleLinePart = { text: string; changed: boolean };

// 戦闘の前の値から、出どころつきの増減と受けたダメージを積み上げ、今の値で締める 1 行（例: HP 40 +25 アイテム「盾」 −20 = 45）。
// 増減も受けたダメージも無ければ、戦闘の前の値だけ。今の値は core の値のままで、計算しない（積み上げと合わなければ、
// イベントの過不足に気づけるように）
export function battleStatParts(
  side: FrameBattleSide,
  stat: "attack" | "hitPoints",
  highlight: FrameBattleHighlight | null,
  owner: "ATTACKER" | "DEFENDER",
): BattleLinePart[] {
  const mine =
    highlight && "side" in highlight && highlight.side === owner
      ? highlight
      : null;
  const label = stat === "attack" ? "AT" : "HP";
  const parts: BattleLinePart[] = [
    { text: `${label} ${side.initial[stat]}`, changed: false },
  ];
  let changedHere = false;
  side.modifiers.forEach((modifier, index) => {
    const delta =
      stat === "attack" ? modifier.attackDelta : modifier.hitPointsDelta;
    if (delta === 0) return;
    // 地形効果を無視されたら、地形効果の分は今の値に数えない（どの増減が外れたかを残して見せる）
    const ignored =
      stat === "hitPoints" &&
      side.terrainIgnored &&
      modifier.source.kind === "terrain";
    const changed =
      (mine?.part === "modifier" && mine.index === index) ||
      (ignored && mine?.part === "terrainIgnored");
    changedHere ||= changed;
    parts.push({
      text: `${signed(delta)} ${sourceLabel(modifier.source)}${ignored ? m.ignoredSuffix : ""}`,
      changed,
    });
  });
  if (stat === "hitPoints") {
    side.damages.forEach((damage, index) => {
      const changed = mine?.part === "damage" && mine.index === index;
      changedHere ||= changed;
      parts.push({ text: signed(-damage), changed });
    });
  }
  if (parts.length === 1) return parts;
  return [...parts, { text: `= ${side.current[stat]}`, changed: changedHere }];
}

// 1 行の文字だけ（色を変えない所で使う）
export function battleStatLine(
  side: FrameBattleSide,
  stat: "attack" | "hitPoints",
): string {
  return battleStatParts(side, stat, null, "ATTACKER")
    .map((part) => part.text)
    .join(" ");
}

// 名前・出したアイテム・得た状態の印（例: コーンフォーク（レザーアーマー） ［先制］）
export function battleSideTitleParts(
  side: FrameBattleSide,
  highlight: FrameBattleHighlight | null,
  owner: "ATTACKER" | "DEFENDER",
): BattleLinePart[] {
  const mine =
    highlight && "side" in highlight && highlight.side === owner
      ? highlight
      : null;
  const item =
    side.item === undefined ? m.notChosen : (side.item ?? m.noItemShort);
  return [
    {
      text: `${side.name}（${item}）`,
      changed: mine?.part === "item",
    },
    ...side.states.map((state, index) => ({
      text: ` ［${CREATURE_ABILITY_LABELS[state]}］`,
      changed: mine?.part === "state" && mine.index === index,
    })),
  ];
}
