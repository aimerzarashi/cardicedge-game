"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import type { BoardTileElement } from "@/graphql/graphql";
import { BoardGrid } from "../../../boards/board-grid";
import { ELEMENT_LABELS } from "../../../boards/board-layout";
import { participantColor } from "../../../boards/board-paint";
import {
  elementsLabel,
  ITEM_CATEGORY_LABELS,
  itemBonusesLabel,
  MATCH_END_REASON_LABELS,
  MATCH_PHASE_LABELS,
  MATCH_PHASE_NOT_WAITING,
  MATCH_REVIEW_MESSAGES,
  RARITY_LABELS,
  SEAT_KIND_LABELS,
} from "../../../messages";
import { eventLine, mergeShown, splitEvents } from "../../match-events";
import {
  currentTurnText,
  participantPieces,
  participantRows,
  reviewRows,
  roundText,
  territoryMarks,
  winnerNames,
} from "../../match-view";
import {
  attackMatchTerritory,
  changeMatchLandElement,
  chooseMatchPath,
  chooseMatchRewardPack,
  defendMatchTerritory,
  deployMatchCreature,
  discardMatchCard,
  drawMatchCard,
  endMatchTurn,
  exchangeMatchCreature,
  invadeMatchTerritory,
  levelUpMatchTerritory,
  moveMatchCreature,
  payMatchToll,
  relinquishMatchTerritory,
  rollMatchDice,
} from "../actions";
import { MatchActionButton } from "../match-action-button";
import { loadMatchDebugEvents } from "./actions";
import {
  applyEvent,
  eventDurationMs,
  type FrameCard,
  type MatchFrame,
  type PlayEvent,
} from "./match-frame";
import {
  choicesAt,
  type StopSelection,
  selectableTerritories,
  selectTile,
} from "./stop-selection";
import { watchProgress } from "./watch-progress";

const LOAD_RETRY_MS = 2000;
const COLUMNS_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 36rem), 1fr))",
  gap: "1rem",
  alignItems: "start",
} as const;
const ROW_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "0.25rem 1rem",
  margin: "0 0 0.5rem",
} as const;
const LIST_STYLE = { margin: 0, padding: 0, listStyle: "none" } as const;
const STATS_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.25rem 1rem",
  margin: 0,
} as const;
const PAIR_STYLE = { display: "flex", gap: "0.25rem" } as const;
const HAND_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.25rem 0.75rem",
  listStyle: "none",
  margin: 0,
  padding: 0,
} as const;

// 盤面の枠・コマの番号と同じ色の印（色の意味は隣の文字でもわかるので、読み上げない）
function ParticipantColorMark({ seat }: { seat: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: "0.8em",
        height: "0.8em",
        marginRight: "0.3em",
        border: "1px solid #10182b",
        background: participantColor(seat),
      }}
    />
  );
}

// 操作は描画ではなく入力なので、再生が追いついたときの match(id) の値で出す
export type MatchPlayerOperations = {
  mine: boolean;
  // 守る段階では番の人ではなく領地の持ち主を待つので、手札もこの人のものを出す
  awaitingParticipant: number | null;
  pathChoices: { x: number; y: number }[];
  deployChoices: number[];
  invadeChoices: number[];
  itemChoices: number[];
  relinquishChoices: { x: number; y: number; name: string; magic: number }[];
  levelUpChoices: {
    x: number;
    y: number;
    level: number;
    magic: number;
    name: string;
  }[];
  exchangeChoices: {
    x: number;
    y: number;
    handIndex: number;
    magic: number;
    name: string;
  }[];
  elementChangeChoices: {
    x: number;
    y: number;
    element: BoardTileElement;
    magic: number;
    name: string;
  }[];
  moveChoices: {
    x: number;
    y: number;
    to: { x: number; y: number };
    name: string;
  }[];
  rewardPacks: { key: string; name: string }[];
};

// アイテムは効果がまだ無く、コストを払って手札から無くなるだけ。攻める側も守る側も同じ形で選ぶ
function ItemOperations({
  action,
  actionProps,
  hand,
  itemChoices,
  verb,
}: {
  action: ComponentProps<typeof MatchActionButton>["action"];
  actionProps: { id: string; revision: number };
  hand: FrameCard[];
  itemChoices: number[];
  verb: string;
}) {
  return (
    <>
      {itemChoices.map((itemHandIndex) => (
        <MatchActionButton
          key={itemHandIndex}
          action={action}
          values={{ itemHandIndex }}
          {...actionProps}
        >
          {hand[itemHandIndex]?.name ?? ""}を出して{verb}
        </MatchActionButton>
      ))}
      <MatchActionButton action={action} {...actionProps}>
        アイテムを出さずに{verb}
      </MatchActionButton>
    </>
  );
}

// 止まった後の選択。1 つ目で何をするかを選び、領地コマンドは盤面で領地を選んでから手札・レベルを選ぶ。選べないものは出さない（2026-11-09 オーナー）
function StopOperations({
  phase,
  actionProps,
  hand,
  operations,
  selection,
  onSelect,
}: {
  phase: "DEPLOYING" | "INVADING" | "TERRITORY_COMMANDING";
  actionProps: { id: string; revision: number };
  hand: FrameCard[];
  operations: MatchPlayerOperations;
  selection: StopSelection | null;
  onSelect: (selection: StopSelection | null) => void;
}) {
  const back = (
    <button type="button" onClick={() => onSelect(null)}>
      選び直す
    </button>
  );
  if (selection === null) {
    return (
      <>
        {operations.levelUpChoices.length > 0 && (
          <button
            type="button"
            onClick={() => onSelect({ command: "levelUp", position: null })}
          >
            土地レベルアップ
          </button>
        )}
        {operations.exchangeChoices.length > 0 && (
          <button
            type="button"
            onClick={() => onSelect({ command: "exchange", position: null })}
          >
            クリーチャー交換
          </button>
        )}
        {operations.elementChangeChoices.length > 0 && (
          <button
            type="button"
            onClick={() =>
              onSelect({ command: "elementChange", position: null })
            }
          >
            属性変更
          </button>
        )}
        {operations.moveChoices.length > 0 && (
          <button
            type="button"
            onClick={() =>
              onSelect({ command: "move", position: null, to: null })
            }
          >
            クリーチャー移動
          </button>
        )}
        {phase === "DEPLOYING" && operations.deployChoices.length > 0 && (
          <button type="button" onClick={() => onSelect({ command: "deploy" })}>
            配置
          </button>
        )}
        {phase === "INVADING" && operations.invadeChoices.length > 0 && (
          <button type="button" onClick={() => onSelect({ command: "invade" })}>
            侵略
          </button>
        )}
        {phase === "INVADING" ? (
          <MatchActionButton action={payMatchToll} {...actionProps}>
            通行料を払う
          </MatchActionButton>
        ) : (
          <MatchActionButton action={endMatchTurn} {...actionProps}>
            ターンを終える
          </MatchActionButton>
        )}
      </>
    );
  }
  if (selection.command === "deploy") {
    return (
      <>
        {operations.deployChoices.map((handIndex) => (
          <MatchActionButton
            key={handIndex}
            action={deployMatchCreature}
            values={{ handIndex }}
            {...actionProps}
          >
            {hand[handIndex]?.name ?? ""}を配置する
          </MatchActionButton>
        ))}
        {back}
      </>
    );
  }
  if (selection.command === "invade") {
    return (
      <>
        {operations.invadeChoices.map((handIndex) => (
          <MatchActionButton
            key={handIndex}
            action={invadeMatchTerritory}
            values={{ handIndex }}
            {...actionProps}
          >
            {hand[handIndex]?.name ?? ""}で侵略する
          </MatchActionButton>
        ))}
        {back}
      </>
    );
  }
  const { position } = selection;
  if (position === null) {
    return (
      <>
        <span data-testid="territory-command-prompt">
          盤面の印の付いた領地を選んでください
        </span>
        {back}
      </>
    );
  }
  if (selection.command === "move") {
    const { to } = selection;
    const choice = operations.moveChoices.find(
      (candidate) =>
        candidate.x === position.x &&
        candidate.y === position.y &&
        candidate.to.x === to?.x &&
        candidate.to.y === to?.y,
    );
    if (to === null || choice === undefined) {
      return (
        <>
          <span data-testid="territory-command-prompt">
            盤面の印の付いた行き先を選んでください
          </span>
          {back}
        </>
      );
    }
    return (
      <>
        <MatchActionButton
          action={moveMatchCreature}
          values={{
            fromX: choice.x,
            fromY: choice.y,
            toX: choice.to.x,
            toY: choice.to.y,
          }}
          {...actionProps}
        >
          {choice.name}を ({choice.to.x}, {choice.to.y}) へ動かす
        </MatchActionButton>
        {back}
      </>
    );
  }
  if (selection.command === "elementChange") {
    return (
      <>
        {choicesAt(operations.elementChangeChoices, position).map((choice) => (
          <MatchActionButton
            key={choice.element}
            action={changeMatchLandElement}
            values={{ x: choice.x, y: choice.y, element: choice.element }}
            {...actionProps}
          >
            {choice.name}の土地を{ELEMENT_LABELS[choice.element]}
            属性にする（魔力 -{choice.magic}）
          </MatchActionButton>
        ))}
        {back}
      </>
    );
  }
  if (selection.command === "levelUp") {
    return (
      <>
        {choicesAt(operations.levelUpChoices, position).map((choice) => (
          <MatchActionButton
            key={choice.level}
            action={levelUpMatchTerritory}
            values={{ x: choice.x, y: choice.y, level: choice.level }}
            {...actionProps}
          >
            {choice.name}の土地をレベル {choice.level} にする（魔力 -
            {choice.magic}）
          </MatchActionButton>
        ))}
        {back}
      </>
    );
  }
  return (
    <>
      {choicesAt(operations.exchangeChoices, position).map((choice) => (
        <MatchActionButton
          key={choice.handIndex}
          action={exchangeMatchCreature}
          values={{ x: choice.x, y: choice.y, handIndex: choice.handIndex }}
          {...actionProps}
        >
          {choice.name}を{hand[choice.handIndex]?.name ?? ""}と交換する（魔力 -
          {choice.magic}）
        </MatchActionButton>
      ))}
      {back}
    </>
  );
}

function Operations({
  id,
  latest,
  operations,
  connected,
  selection,
  onSelect,
}: {
  id: string;
  latest: MatchFrame;
  operations: MatchPlayerOperations;
  connected: boolean;
  selection: StopSelection | null;
  onSelect: (selection: StopSelection | null) => void;
}) {
  const actionProps = { id, revision: latest.revision };
  const hand =
    latest.participants[operations.awaitingParticipant ?? 0]?.hand ?? [];
  if (latest.outcome) {
    return (
      <div style={ROW_STYLE}>
        {operations.rewardPacks.map((pack) => (
          <MatchActionButton
            key={pack.key}
            action={chooseMatchRewardPack}
            values={{ pack: pack.key }}
            {...actionProps}
          >
            {MATCH_REVIEW_MESSAGES.chooseRewardPack(pack.name)}
          </MatchActionButton>
        ))}
      </div>
    );
  }
  if (!operations.mine) {
    // 進みが Subscription で見えているときは、読み直すリンクは要らない（つながっていないときの逃げ道だけ出す）
    return (
      <p style={{ margin: "0 0 0.5rem" }}>
        他の参加者（NPC）の番です。
        {!connected && (
          <>
            {" "}
            {/* Link は同じ URL だと読み直さないことがあるため、普通のリンクで読み込み直す */}
            <a href={`/matches/${id}/debug`}>読み直す</a>
          </>
        )}
      </p>
    );
  }
  return (
    <div style={ROW_STYLE}>
      <strong>あなたの番です</strong>
      {latest.phase === "DRAWING" && (
        <MatchActionButton action={drawMatchCard} {...actionProps}>
          カードを引く
        </MatchActionButton>
      )}
      {latest.phase === "DISCARDING" &&
        hand.map((card, handIndex) => (
          <MatchActionButton
            // biome-ignore lint/suspicious/noArrayIndexKey: 同じカードが複数並ぶため、手札の番号で区別する
            key={handIndex}
            action={discardMatchCard}
            values={{ handIndex }}
            {...actionProps}
          >
            {card.name}を捨てる
          </MatchActionButton>
        ))}
      {latest.phase === "ROLLING" && (
        <MatchActionButton action={rollMatchDice} {...actionProps}>
          サイコロを振る
        </MatchActionButton>
      )}
      {latest.phase === "CHOOSING_PATH" &&
        operations.pathChoices.map((position) => (
          <MatchActionButton
            key={`${position.x},${position.y}`}
            action={chooseMatchPath}
            values={{ x: position.x, y: position.y }}
            {...actionProps}
          >
            ({position.x}, {position.y}) へ進む
          </MatchActionButton>
        ))}
      {(latest.phase === "DEPLOYING" ||
        latest.phase === "INVADING" ||
        latest.phase === "TERRITORY_COMMANDING") && (
        <StopOperations
          phase={latest.phase}
          actionProps={actionProps}
          hand={hand}
          operations={operations}
          selection={selection}
          onSelect={onSelect}
        />
      )}
      {latest.phase === "ATTACKING" && (
        <ItemOperations
          action={attackMatchTerritory}
          actionProps={actionProps}
          hand={hand}
          itemChoices={operations.itemChoices}
          verb="攻める"
        />
      )}
      {latest.phase === "DEFENDING" && (
        <ItemOperations
          action={defendMatchTerritory}
          actionProps={actionProps}
          hand={hand}
          itemChoices={operations.itemChoices}
          verb="戦闘に進む"
        />
      )}
      {latest.phase === "RELINQUISHING" &&
        operations.relinquishChoices.map((choice) => (
          <MatchActionButton
            key={`${choice.x},${choice.y}`}
            action={relinquishMatchTerritory}
            values={{ x: choice.x, y: choice.y }}
            {...actionProps}
          >
            ({choice.x}, {choice.y}) の{choice.name}を手放す（魔力 +
            {choice.magic}）
          </MatchActionButton>
        ))}
      {latest.phase === "ENDING" && (
        <MatchActionButton action={endMatchTurn} {...actionProps}>
          ターンを終える
        </MatchActionButton>
      )}
    </div>
  );
}

function FrameView({
  frame,
  roundLimit,
}: {
  frame: MatchFrame;
  roundLimit: number;
}) {
  return (
    <div data-testid="match-frame" data-revision={frame.revision}>
      <div style={ROW_STYLE}>
        <span data-testid="match-round">
          {roundText(frame.round, roundLimit)}
        </span>
        <span>
          今の番:{" "}
          <span data-testid="match-current">
            {currentTurnText(frame.participants, frame.currentParticipant)}
          </span>
        </span>
        <span>
          段階:{" "}
          <span data-testid="match-phase">
            {frame.phase
              ? MATCH_PHASE_LABELS[frame.phase]
              : MATCH_PHASE_NOT_WAITING}
          </span>
        </span>
        <span>
          サイコロの目:{" "}
          <span data-testid="match-dice">
            {frame.dice ?? "まだ振っていません"}
          </span>
        </span>
        <span>
          残りの歩数:{" "}
          <span data-testid="match-remaining-steps">
            {frame.remainingSteps}
          </span>
        </span>
      </div>

      {frame.outcome && (
        <div data-testid="match-outcome">
          <div style={ROW_STYLE}>
            <strong>対戦の結果</strong>
            <span>
              勝った人:{" "}
              <span data-testid="match-winners">
                {winnerNames(frame.participants, frame.outcome.winners)}
              </span>
            </span>
            <span>理由: {MATCH_END_REASON_LABELS[frame.outcome.reason]}</span>
            <span data-testid="match-rounds">
              {MATCH_REVIEW_MESSAGES.rounds(frame.round)}
            </span>
          </div>
          <ol data-testid="match-review" style={LIST_STYLE}>
            {reviewRows(frame.participants, frame.outcome.ranks).map((row) => (
              <li
                key={row.seat}
                data-testid="match-review-row"
                style={{ marginBottom: "0.5rem" }}
              >
                <span data-testid="review-rank">
                  {MATCH_REVIEW_MESSAGES.rank(row.rank)}
                </span>{" "}
                コマ {row.seat + 1}・{row.name}・総魔力 {row.totalMagic}
                {" ・ "}
                {!row.isPlayer ? (
                  MATCH_REVIEW_MESSAGES.rewardNone
                ) : row.rewardReceived ? (
                  <span data-testid="review-reward-cards">
                    {MATCH_REVIEW_MESSAGES.rewardCards(
                      row.rewardCards.join("、"),
                    )}
                  </span>
                ) : (
                  MATCH_REVIEW_MESSAGES.rewardPending
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <h2>参加者</h2>
      <ul data-testid="match-participants" style={LIST_STYLE}>
        {participantRows(frame.participants, frame.currentParticipant).map(
          (row) => {
            const participant = frame.participants[row.seat];
            return (
              <li
                key={row.seat}
                data-testid="match-participant"
                style={{ marginBottom: "0.5rem" }}
              >
                <p style={{ margin: 0 }}>
                  <ParticipantColorMark seat={row.seat} />
                  コマ {row.piece}・{SEAT_KIND_LABELS[participant.kind]}・
                  {participant.avatar.name}
                  {row.isCurrent && (
                    <strong data-testid="match-current-mark">（今の番）</strong>
                  )}
                </p>
                <dl style={STATS_STYLE}>
                  <div style={PAIR_STYLE}>
                    <dt>魔力</dt>
                    <dd style={{ margin: 0 }} data-testid="participant-magic">
                      {participant.magic}
                    </dd>
                  </div>
                  <div style={PAIR_STYLE}>
                    <dt>総魔力</dt>
                    <dd
                      style={{ margin: 0 }}
                      data-testid="participant-total-magic"
                    >
                      {participant.totalMagic}
                    </dd>
                  </div>
                  <div style={PAIR_STYLE}>
                    <dt>位置</dt>
                    <dd
                      style={{ margin: 0 }}
                      data-testid="participant-position"
                    >
                      ({participant.position.x}, {participant.position.y})
                    </dd>
                  </div>
                  <div style={PAIR_STYLE}>
                    <dt>通ったチェックポイント</dt>
                    <dd
                      style={{ margin: 0 }}
                      data-testid="participant-checkpoints"
                    >
                      {participant.passedCheckpoints.length}
                    </dd>
                  </div>
                  <div style={PAIR_STYLE}>
                    <dt>山札の残り</dt>
                    <dd
                      style={{ margin: 0 }}
                      data-testid="participant-draw-pile"
                    >
                      {participant.drawPileCount}
                    </dd>
                  </div>
                  <div style={PAIR_STYLE}>
                    <dt style={{ flexShrink: 0 }}>捨て札</dt>
                    <dd style={{ margin: 0 }}>
                      <span data-testid="participant-discard-pile-count">
                        {participant.discardPile.length}
                      </span>
                      <ul
                        data-testid="participant-discard-pile"
                        style={HAND_STYLE}
                      >
                        {participant.discardPile.map((card, cardIndex) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: 同じカードが複数並ぶため、入った順で区別する
                          <li key={cardIndex}>
                            <Link href={`/cards/${card.id}`}>{card.name}</Link>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div style={PAIR_STYLE}>
                    <dt style={{ flexShrink: 0 }}>手札</dt>
                    <dd style={{ margin: 0 }}>
                      <ul data-testid="participant-hand" style={HAND_STYLE}>
                        {participant.hand.map((card, cardIndex) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: 同じカードが複数並ぶため、引いた順で区別する
                          <li key={cardIndex}>
                            <Link href={`/cards/${card.id}`}>{card.name}</Link>
                            （コスト {card.cost}・{RARITY_LABELS[card.rarity]}
                            {card.elements &&
                              `・${elementsLabel(card.elements)}・AT ${card.attack}・HP ${card.hitPoints}・移動 ${card.movement}`}
                            {card.category &&
                              `・${ITEM_CATEGORY_LABELS[card.category]}・${itemBonusesLabel(card.attackBonus ?? 0, card.hitPointsBonus ?? 0)}`}
                            ）
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
              </li>
            );
          },
        )}
      </ul>

      {frame.invasion && (
        <p data-testid="match-invasion">
          侵略: ({frame.invasion.position.x}, {frame.invasion.position.y}) に
          {frame.invasion.card.name}（AT {frame.invasion.card.attack}・HP{" "}
          {frame.invasion.hitPoints}）
        </p>
      )}
      {frame.battle && (
        <p data-testid="match-battle">
          戦闘: 攻める側 AT {frame.battle.attacker.attack}・HP{" "}
          {frame.battle.attacker.hitPoints} ／ 守る側 AT{" "}
          {frame.battle.defender.attack}・HP {frame.battle.defender.hitPoints}
        </p>
      )}

      <h2>領地</h2>
      {frame.territories.length === 0 ? (
        <p>まだ領地はありません</p>
      ) : (
        <ul data-testid="match-territories">
          {frame.territories.map((territory) => (
            <li key={territory.creature.id}>
              <ParticipantColorMark seat={territory.owner} />
              {territory.creature.id} ({territory.position.x},{" "}
              {territory.position.y}) コマ {territory.owner + 1}（
              {frame.participants[territory.owner]?.avatar.name}）:{" "}
              <Link href={`/cards/${territory.creature.card.id}`}>
                {territory.creature.card.name}
              </Link>
              （AT {territory.creature.card.attack}・HP{" "}
              {territory.creature.hitPoints}）レベル {territory.level}
              ・価値 {territory.value}・通行料 {territory.toll}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 表示はフレームだけから作る。開いた時点の match(id) を最初のフレームにして、matchEvents のイベントを 1 つずつ当てる
export function MatchPlayer({
  id,
  latest,
  operations,
  roundLimit,
  base,
  board,
  children,
}: {
  id: string;
  latest: MatchFrame;
  operations: MatchPlayerOperations;
  roundLimit: number;
  base: { x: number; y: number };
  board: Omit<ComponentProps<typeof BoardGrid>, "pieces" | "territories">;
  children: ReactNode;
}) {
  const router = useRouter();
  const [frame, setFrame] = useState(latest);
  // 選んでいる途中のことは、対戦が進んだら捨てる（前の版の選択肢で送らないため）
  const [selection, setSelection] = useState<StopSelection | null>(null);
  const [selectedAt, setSelectedAt] = useState(latest.revision);
  if (selectedAt !== latest.revision) {
    setSelectedAt(latest.revision);
    setSelection(null);
  }
  // 開いた時点の版。それより前は今の状態として出ているので、欄に入れるだけで再生しない
  const [opened] = useState(latest.revision);
  const [connected, setConnected] = useState(false);
  const [target, setTarget] = useState(0);
  const [fetched, setFetched] = useState(0);
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<PlayEvent[]>([]);
  const [shown, setShown] = useState<PlayEvent[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    watchProgress(
      id,
      controller.signal,
      (next) => setTarget((current) => Math.max(current, next)),
      setConnected,
    );
    return () => controller.abort();
  }, [id]);

  // Subscription で届いた版を読むので、Server Component の読み込みでは間に合わず、ここだけ effect で読む
  useEffect(() => {
    const goal = Math.max(target, latest.revision);
    if (loading || goal <= fetched) return;
    setLoading(true);
    const retry = () => setTimeout(() => setLoading(false), LOAD_RETRY_MS);
    loadMatchDebugEvents(id, fetched).then((result) => {
      if (!result.ok) {
        retry();
        return;
      }
      const events = result.events.filter((event) => event.revision > fetched);
      const { silent, play } = splitEvents(events, opened);
      setShown((current) => mergeShown(current, silent));
      setQueue((current) => [...current, ...play]);
      setFetched(events.at(-1)?.revision ?? goal);
      setLoading(false);
    }, retry);
  }, [id, opened, target, latest.revision, fetched, loading]);

  useEffect(() => {
    const head = queue[0];
    if (!head) return;
    const timer = setTimeout(() => {
      setQueue((current) => current.slice(1));
      setFrame((current) => applyEvent(current, head, base));
      setShown((current) => mergeShown(current, [head]));
      if (queue.length === 1) {
        router.refresh();
      }
    }, eventDurationMs(head));
    return () => clearTimeout(timer);
  }, [queue, base, router]);

  // 再生が最新の版に届くまで、操作は出さない（コマが着く前に次の操作をさせないため）
  const caughtUp = queue.length === 0 && frame.revision === latest.revision;
  const selectable = caughtUp
    ? selectableTerritories(selection, operations)
    : [];
  const names = frame.participants.map(
    (participant) => participant.avatar.name,
  );

  return (
    <div style={COLUMNS_STYLE}>
      <BoardGrid
        {...board}
        tiles={board.tiles.map((tile) => {
          const changed = frame.landElements.find(
            (candidate) =>
              candidate.position.x === tile.x &&
              candidate.position.y === tile.y,
          );
          return changed && tile.__typename === "LandTile"
            ? { ...tile, element: changed.element }
            : tile;
        })}
        territories={territoryMarks(frame.territories)}
        landLevels={frame.landLevels.map((land) => ({
          ...land.position,
          level: land.level,
        }))}
        pieces={participantPieces(frame.participants)}
        selectable={selectable}
        onTile={(position) => {
          if (selection) {
            setSelection(selectTile(selection, position));
          }
        }}
      />
      <div>
        {caughtUp ? (
          <Operations
            id={id}
            latest={latest}
            operations={operations}
            connected={connected}
            selection={selection}
            onSelect={setSelection}
          />
        ) : (
          <p data-testid="match-replaying" style={{ margin: "0 0 0.5rem" }}>
            再生しています…
          </p>
        )}
        <FrameView frame={frame} roundLimit={roundLimit} />
        {children}
        <h2>描画したイベント</h2>
        {shown.length === 0 ? (
          <p>まだありません</p>
        ) : (
          <ol data-testid="match-events" style={LIST_STYLE}>
            {[...shown]
              .sort((a, b) => b.revision - a.revision)
              .map((event) => (
                <li key={event.revision}>{eventLine(event, names)}</li>
              ))}
          </ol>
        )}
      </div>
    </div>
  );
}
