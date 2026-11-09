"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { BoardGrid } from "../../../boards/board-grid";
import { participantColor } from "../../../boards/board-paint";
import {
  elementsLabel,
  MATCH_END_REASON_LABELS,
  MATCH_PHASE_LABELS,
  MATCH_PHASE_NOT_WAITING,
  MATCH_REVIEW_MESSAGES,
  RARITY_LABELS,
  SEAT_KIND_LABELS,
} from "../../../messages";
import { eventLine } from "../../match-events";
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
  chooseMatchPath,
  chooseMatchRewardPack,
  deployMatchCreature,
  discardMatchCard,
  drawMatchCard,
  endMatchTurn,
  relinquishMatchTerritory,
  rollMatchDice,
} from "../actions";
import { MatchActionButton } from "../match-action-button";
import { watchProgress } from "../match-live";
import { loadMatchDebugEvents } from "./actions";
import {
  applyEvent,
  eventDurationMs,
  type MatchFrame,
  type PlayEvent,
} from "./match-frame";

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

// 操作は描画ではなく入力なので、再生が追いついたときの match(id) の値で出す
export type MatchPlayerOperations = {
  mine: boolean;
  pathChoices: { x: number; y: number }[];
  deployChoices: number[];
  relinquishChoices: { x: number; y: number; name: string; magic: number }[];
  rewardPacks: { key: string; name: string }[];
};

function Operations({
  id,
  latest,
  operations,
}: {
  id: string;
  latest: MatchFrame;
  operations: MatchPlayerOperations;
}) {
  const actionProps = { id, revision: latest.revision };
  const hand = latest.participants[latest.currentParticipant ?? 0]?.hand ?? [];
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
    return <p style={{ margin: "0 0 0.5rem" }}>他の参加者（NPC）の番です。</p>;
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
      {latest.phase === "DEPLOYING" &&
        operations.deployChoices.map((handIndex) => (
          <MatchActionButton
            key={handIndex}
            action={deployMatchCreature}
            values={{ handIndex }}
            {...actionProps}
          >
            {hand[handIndex]?.name ?? ""}を配置する
          </MatchActionButton>
        ))}
      {latest.phase === "DEPLOYING" && (
        <MatchActionButton action={endMatchTurn} {...actionProps}>
          配置せずにターンを終える
        </MatchActionButton>
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
              勝った人: {winnerNames(frame.participants, frame.outcome.winners)}
            </span>
            <span>理由: {MATCH_END_REASON_LABELS[frame.outcome.reason]}</span>
            <span>{MATCH_REVIEW_MESSAGES.rounds(frame.round)}</span>
          </div>
          <ol style={LIST_STYLE}>
            {reviewRows(frame.participants, frame.outcome.ranks).map((row) => (
              <li key={row.seat}>
                {MATCH_REVIEW_MESSAGES.rank(row.rank)} コマ {row.seat + 1}・
                {row.name}・総魔力 {row.totalMagic}
                {row.rewardReceived &&
                  ` ・ ${MATCH_REVIEW_MESSAGES.rewardCards(row.rewardCards.join("、"))}`}
              </li>
            ))}
          </ol>
        </div>
      )}

      <h2>参加者</h2>
      <ul style={LIST_STYLE}>
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
                  <span
                    aria-hidden
                    style={{ color: participantColor(row.seat) }}
                  >
                    ■
                  </span>
                  コマ {row.piece}・{SEAT_KIND_LABELS[participant.kind]}・
                  {participant.avatar.name}
                  {row.isCurrent && <strong>（今の番）</strong>}
                </p>
                <p style={{ margin: 0 }}>
                  魔力{" "}
                  <span data-testid="participant-magic">
                    {participant.magic}
                  </span>
                  ・総魔力{" "}
                  <span data-testid="participant-total-magic">
                    {participant.totalMagic}
                  </span>
                  ・位置{" "}
                  <span data-testid="participant-position">
                    ({participant.position.x}, {participant.position.y})
                  </span>
                  ・通ったチェックポイント{" "}
                  {participant.passedCheckpoints.length}・山札の残り{" "}
                  {participant.drawPileCount}
                </p>
                <ul data-testid="participant-hand" style={LIST_STYLE}>
                  {participant.hand.map((card, cardIndex) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: 同じカードが複数並ぶため、引いた順で区別する
                    <li key={cardIndex}>
                      <Link href={`/cards/${card.id}`}>{card.name}</Link>
                      （コスト {card.cost}・{RARITY_LABELS[card.rarity]}
                      {card.elements &&
                        `・${elementsLabel(card.elements)}・AT ${card.attack}・HP ${card.hitPoints}`}
                      ）
                    </li>
                  ))}
                </ul>
              </li>
            );
          },
        )}
      </ul>

      <h2>領地</h2>
      {frame.territories.length === 0 ? (
        <p>まだ領地はありません</p>
      ) : (
        <ul data-testid="match-territories">
          {frame.territories.map((territory) => (
            <li key={territory.creature.id}>
              {territory.creature.id} ({territory.position.x},{" "}
              {territory.position.y}) コマ {territory.owner + 1}:{" "}
              <Link href={`/cards/${territory.creature.card.id}`}>
                {territory.creature.card.name}
              </Link>
              （HP {territory.creature.hitPoints}）レベル {territory.level}
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
  const [target, setTarget] = useState(0);
  const [fetched, setFetched] = useState(latest.revision);
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<PlayEvent[]>([]);
  const [shown, setShown] = useState<PlayEvent[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    watchProgress(
      id,
      controller.signal,
      (next) => setTarget((current) => Math.max(current, next)),
      () => {},
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
      setQueue((current) => [...current, ...events]);
      setFetched(events.at(-1)?.revision ?? goal);
      setLoading(false);
    }, retry);
  }, [id, target, latest.revision, fetched, loading]);

  useEffect(() => {
    const head = queue[0];
    if (!head) return;
    const timer = setTimeout(() => {
      setQueue((current) => current.slice(1));
      setFrame((current) => applyEvent(current, head, base));
      setShown((current) => [head, ...current]);
      if (queue.length === 1) {
        router.refresh();
      }
    }, eventDurationMs(head));
    return () => clearTimeout(timer);
  }, [queue, base, router]);

  // 再生が最新の版に届くまで、操作は出さない（コマが着く前に次の操作をさせないため）
  const caughtUp = queue.length === 0 && frame.revision === latest.revision;
  const names = frame.participants.map(
    (participant) => participant.avatar.name,
  );

  return (
    <div style={COLUMNS_STYLE}>
      <BoardGrid
        {...board}
        territories={territoryMarks(frame.territories)}
        pieces={participantPieces(frame.participants)}
      />
      <div>
        {caughtUp ? (
          <Operations id={id} latest={latest} operations={operations} />
        ) : (
          <p data-testid="match-replaying" style={{ margin: "0 0 0.5rem" }}>
            再生しています…
          </p>
        )}
        <FrameView frame={frame} roundLimit={roundLimit} />
        {children}
        <h2>再生したイベント</h2>
        {shown.length === 0 ? (
          <p>まだありません</p>
        ) : (
          <ol data-testid="match-events" style={LIST_STYLE}>
            {shown.map((event) => (
              <li key={event.revision}>{eventLine(event, names)}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
