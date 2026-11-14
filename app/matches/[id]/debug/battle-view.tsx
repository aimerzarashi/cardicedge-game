import { BATTLE_SCENE_LABELS, BATTLE_VIEW_MESSAGES } from "../../../messages";
import {
  type BattleLinePart,
  battleSideTitleParts,
  battleStatParts,
} from "./battle-lines";
import {
  BATTLE_SCENES,
  battleScene,
  type FrameBattleHighlight,
  type FrameBattleSide,
  type MatchFrame,
} from "./match-frame";

// 直前のイベントで変わった所の色（見た目は暫定）
const CHANGED_STYLE = { color: "#d9480f", fontWeight: "bold" } as const;

function Parts({ parts }: { parts: BattleLinePart[] }) {
  return parts.map((part, index) => (
    // 部品の並びは描くたびに同じ順で作り直すので、位置を鍵にする
    // biome-ignore lint/suspicious/noArrayIndexKey: 並びの位置そのものが部品の意味
    <span key={index} style={part.changed ? CHANGED_STYLE : undefined}>
      {index > 0 && part.text.startsWith(" ") ? "" : index > 0 ? " " : ""}
      {part.text}
    </span>
  ));
}

const m = BATTLE_VIEW_MESSAGES;

function itemLabel(item: string | null | undefined): string {
  if (item === undefined) return m.notChosen;
  return item ?? m.noItem;
}

function SideView({
  testId,
  title,
  side,
  first,
  owner,
  highlight,
}: {
  testId: string;
  title: string;
  side: FrameBattleSide;
  first: boolean;
  owner: "ATTACKER" | "DEFENDER";
  highlight: FrameBattleHighlight | null;
}) {
  return (
    <div data-testid={testId}>
      <strong>
        {title}
        {first && ` ${m.firstMark}`}
      </strong>{" "}
      <Parts parts={battleSideTitleParts(side, highlight, owner)} />
      <div>
        <Parts parts={battleStatParts(side, "attack", highlight, owner)} />
      </div>
      <div>
        <Parts parts={battleStatParts(side, "hitPoints", highlight, owner)} />
      </div>
    </div>
  );
}

// 戦闘をシーンと両方の積み上げで描く（盤面の下。見た目は暫定で、本格的なデザインのときに作り直す。描く元のフレームの形は残る。
// イベントの過不足に気づく場にするため。game#98）
export function BattleView({ frame }: { frame: MatchFrame }) {
  const scene = battleScene(frame);
  if (!scene) return null;
  const { battle, invasion } = frame;
  return (
    <section data-testid="match-battle" style={{ marginTop: "0.5rem" }}>
      <h2 style={{ margin: "0 0 0.25rem" }}>{m.title}</h2>
      <p data-testid="match-battle-scenes" style={{ margin: 0 }}>
        {BATTLE_SCENES.map((candidate, index) => (
          <span key={candidate}>
            {index > 0 && " ▸ "}
            {candidate === scene ? (
              <strong aria-current="step">
                【{BATTLE_SCENE_LABELS[candidate]}】
              </strong>
            ) : (
              BATTLE_SCENE_LABELS[candidate]
            )}
          </span>
        ))}
        {battle?.result && (
          <strong
            data-testid="match-battle-result"
            style={
              battle.highlight?.part === "result" ? CHANGED_STYLE : undefined
            }
          >
            {" "}
            {battle.result === "conquered" ? m.conquered : m.repelled}
          </strong>
        )}
      </p>
      {battle ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
            gap: "0.5rem",
            marginTop: "0.25rem",
          }}
        >
          <SideView
            testId="match-battle-attacker"
            title={m.attacker}
            side={battle.attacker}
            first={battle.firstStriker === "ATTACKER"}
            owner="ATTACKER"
            highlight={battle.highlight}
          />
          <SideView
            testId="match-battle-defender"
            title={m.defender}
            side={battle.defender}
            first={battle.firstStriker === "DEFENDER"}
            owner="DEFENDER"
            highlight={battle.highlight}
          />
        </div>
      ) : (
        invasion && (
          <p style={{ margin: "0.25rem 0 0" }}>
            {m.attacker}: {invasion.card.name}（
            {itemLabel(invasion.attackerItem)}） ／ {m.defender}:{" "}
            {itemLabel(invasion.defenderItem)}
          </p>
        )
      )}
    </section>
  );
}
