import Link from "next/link";
import { callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import {
  MATCH_REVIEW_MESSAGES,
  matchNumberLabel,
  RULE_LABELS,
  type RuleField,
} from "../../../messages";
import { isMyTurn } from "../../match-view";
import type { MatchFrame } from "./match-frame";
import { MatchPlayer, type MatchPlayerOperations } from "./match-player";
import { matchDebugQuery } from "./operations";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RULE_FIELDS = Object.keys(RULE_LABELS) as RuleField[];
const RULES_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.25rem 1rem",
  margin: 0,
} as const;
const PAIR_STYLE = { display: "flex", gap: "0.25rem" } as const;

function Message({ children }: { children: string }) {
  return (
    <main>
      <h1>対戦</h1>
      <p role="alert">{children}</p>
      <p>
        <Link href="/rooms">部屋の一覧へ</Link>
      </p>
    </main>
  );
}

// 表示はイベントの再生で作る（match-player.tsx）。ここで読む match(id) は、開いた時点のフレームと、
// 再生が追いついたときに出す操作の元
export default async function MatchDebugPage({
  params,
}: PageProps<"/matches/[id]/debug">) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return <Message>この対戦は見つかりません</Message>;
  }
  const player = await currentPlayer();
  const result = player.ok ? await callCore(matchDebugQuery, { id }) : player;
  if (!result.ok) {
    return (
      <Message>
        core に接続できません。時間をおいて再読み込みしてください。
      </Message>
    );
  }
  const match = result.data.match;
  switch (match.__typename) {
    case "MatchNotFoundError":
      return <Message>この対戦は見つかりません</Message>;
    case "PlayerNotRegisteredError":
      throw new Error("player is not registered after registerPlayer");
    case "Match":
      break;
  }
  const playerId = player.ok ? player.data.id : "";
  const latest: MatchFrame = {
    revision: match.revision,
    round: match.round,
    phase: match.phase,
    dice: match.dice ?? null,
    // 開いた時点の 1 個ずつの目は返らないので、合計だけを出す
    diceFaces: [],
    remainingSteps: match.remainingSteps,
    currentParticipant: match.currentParticipant ?? null,
    participants: match.participants.map((participant) => ({
      ...participant,
      lastingSpellEffect: participant.lastingSpellEffect ?? null,
    })),
    territories: match.territories,
    invasion: match.invasion ?? null,
    // 戦闘は 1 回の操作の中で終わるので、開いた時点の状態には無い
    battle: null,
    landLevels: match.landLevels,
    // 開いた時点の属性は盤面のマスが持つので、ここには開いた後に変わった分だけを足す
    landElements: [],
    outcome: match.outcome ?? null,
  };
  const operations: MatchPlayerOperations = {
    mine: isMyTurn(match.participants, match.awaitingParticipant, playerId),
    awaitingParticipant: match.awaitingParticipant ?? null,
    invadeChoices: match.invadeChoices,
    itemChoices: match.itemChoices,
    pathChoices: match.pathChoices,
    spellChoices: match.spellChoices.map((choice) => ({
      handIndex: choice.handIndex,
      targets: choice.targets.map((target) => ({
        index: target,
        name: match.participants[target]?.avatar.name ?? "",
      })),
      targetPositions: choice.targetPositions.map((position) => ({
        ...position,
        name:
          match.territories.find(
            (territory) =>
              territory.position.x === position.x &&
              territory.position.y === position.y,
          )?.creature.card.name ?? "",
      })),
    })),
    placeChoices: match.placeChoices,
    relinquishChoices: match.relinquishChoices.map((position) => {
      const territory = match.territories.find(
        (candidate) =>
          candidate.position.x === position.x &&
          candidate.position.y === position.y,
      );
      return {
        ...position,
        name: territory?.creature.card.name ?? "",
        magic: territory?.relinquishMagic ?? 0,
      };
    }),
    levelUpChoices: match.levelUpChoices.map((choice) => ({
      x: choice.position.x,
      y: choice.position.y,
      level: choice.level,
      magic: choice.magic,
      name:
        match.territories.find(
          (candidate) =>
            candidate.position.x === choice.position.x &&
            candidate.position.y === choice.position.y,
        )?.creature.card.name ?? "",
    })),
    exchangeChoices: match.exchangeChoices.map((choice) => ({
      x: choice.position.x,
      y: choice.position.y,
      handIndex: choice.handIndex,
      magic: choice.magic,
      name:
        match.territories.find(
          (candidate) =>
            candidate.position.x === choice.position.x &&
            candidate.position.y === choice.position.y,
        )?.creature.card.name ?? "",
    })),
    elementChangeChoices: match.elementChangeChoices.map((choice) => ({
      x: choice.position.x,
      y: choice.position.y,
      element: choice.element,
      magic: choice.magic,
      name:
        match.territories.find(
          (candidate) =>
            candidate.position.x === choice.position.x &&
            candidate.position.y === choice.position.y,
        )?.creature.card.name ?? "",
    })),
    moveChoices: match.moveChoices.map((choice) => ({
      x: choice.from.x,
      y: choice.from.y,
      to: choice.to,
      name:
        match.territories.find(
          (candidate) =>
            candidate.position.x === choice.from.x &&
            candidate.position.y === choice.from.y,
        )?.creature.card.name ?? "",
    })),
    rewardPacks: match.rewardPacks,
  };
  const base = match.board.tiles.find((tile) => tile.__typename === "BaseTile");

  return (
    <main>
      <h1>
        対戦（デバッグ）
        {match.number !== null && match.number !== undefined && (
          <>
            {" "}
            <span data-testid="match-number">
              {matchNumberLabel(match.number)}
            </span>
          </>
        )}
      </h1>
      <p>
        {match.roomId && (
          <>
            <Link href={`/rooms/${match.roomId}`}>
              {MATCH_REVIEW_MESSAGES.backToRoom}
            </Link>
            {"・"}
          </>
        )}
        <Link href="/rooms">部屋の一覧へ</Link>
      </p>
      <MatchPlayer
        id={match.id}
        latest={latest}
        operations={operations}
        roundLimit={match.rules.roundLimit}
        base={{ x: base?.x ?? 0, y: base?.y ?? 0 }}
        board={{
          width: match.board.width,
          height: match.board.height,
          tiles: match.board.tiles,
          pairs: match.board.pairs,
        }}
      >
        <h2>ルール</h2>
        <dl data-testid="match-rules" style={RULES_STYLE}>
          {RULE_FIELDS.map((field) => (
            <div key={field} style={PAIR_STYLE}>
              <dt>{RULE_LABELS[field]}</dt>
              <dd style={{ margin: 0 }}>{match.rules[field]}</dd>
            </div>
          ))}
          <div style={PAIR_STYLE}>
            <dt>手札の上限</dt>
            <dd style={{ margin: 0 }}>{match.rules.maxHandCards}</dd>
          </div>
          <div style={PAIR_STYLE}>
            <dt>配る枚数</dt>
            <dd style={{ margin: 0 }}>{match.rules.startingHandCards}</dd>
          </div>
          <div style={PAIR_STYLE}>
            <dt>通行料の割合</dt>
            <dd style={{ margin: 0 }}>{match.rules.tollPercentage}%</dd>
          </div>
          <div style={PAIR_STYLE}>
            <dt>手放すときの割合</dt>
            <dd style={{ margin: 0 }}>{match.rules.relinquishPercentage}%</dd>
          </div>
        </dl>
      </MatchPlayer>
    </main>
  );
}
