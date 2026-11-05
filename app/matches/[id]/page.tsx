import Link from "next/link";
import { Fragment } from "react";
import { graphql } from "@/graphql";
import { callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import { BoardGrid } from "../../boards/board-grid";
import {
  MATCH_END_REASON_LABELS,
  MATCH_PHASE_LABELS,
  RULE_LABELS,
  type RuleField,
  SEAT_KIND_LABELS,
} from "../../messages";
import {
  currentTurnText,
  isMyTurn,
  participantPieces,
  roundText,
  turnOrderNames,
  winnerNames,
} from "../match-view";
import {
  chooseMatchPath,
  discardMatchCard,
  drawMatchCard,
  endMatchTurn,
  rollMatchDice,
} from "./actions";
import { MatchActionButton } from "./match-action-button";

const matchQuery = graphql(`
  query MatchDetail($id: UUID!) {
    match(id: $id) {
      __typename
      ... on Match {
        id
        revision
        round
        phase
        dice
        remainingSteps
        pathChoices {
          x
          y
        }
        outcome {
          winners
          reason
        }
        rules {
          targetMagic
          startingMagic
          lapBonus
          checkpointBonus
          roundLimit
          diceMin
          diceMax
          maxHandCards
          startingHandCards
        }
        board {
          width
          height
          tiles {
            __typename
            x
            y
            ... on LandTile {
              attribute
            }
          }
          pairs {
            a {
              x
              y
            }
            b {
              x
              y
            }
          }
        }
        participants {
          kind
          playerId
          avatar {
            id
            name
          }
          position {
            x
            y
          }
          magic
          hand {
            id
            name
          }
          drawPileCount
          turnOrder
          passedCheckpoints {
            x
            y
          }
        }
        currentParticipant
      }
    }
  }
`);

// 形の違う ID を core に渡すと GraphQL の誤りになり、想定外として扱われるため、形だけを確かめる
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RULE_FIELDS = Object.keys(RULE_LABELS) as RuleField[];

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

export default async function MatchPage({
  params,
}: PageProps<"/matches/[id]">) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return <Message>この対戦は見つかりません</Message>;
  }

  // 未登録のプレイヤーは core の match が PlayerNotRegisteredError を返すため、先に登録を済ませる
  const player = await currentPlayer();
  const result = player.ok ? await callCore(matchQuery, { id }) : player;
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
      // 登録の直後に未登録のままなのは、core の不具合（想定外）
      throw new Error("player is not registered after registerPlayer");
    case "Match":
      break;
  }

  // currentPlayer は上で成功を確かめている（失敗なら core に接続できない表示で返している）
  const playerId = player.ok ? player.data.id : "";
  const mine = isMyTurn(match.participants, match.currentParticipant, playerId);
  const actionProps = { id: match.id, revision: match.revision };

  return (
    <main data-revision={match.revision}>
      <h1>対戦</h1>
      <p data-testid="match-round">
        {roundText(match.round, match.rules.roundLimit)}
      </p>
      <p>
        今の番:{" "}
        <span data-testid="match-current">
          {currentTurnText(match.participants, match.currentParticipant)}
        </span>
      </p>

      <p>
        段階:{" "}
        <span data-testid="match-phase">{MATCH_PHASE_LABELS[match.phase]}</span>
      </p>
      <p>
        サイコロの目:{" "}
        <span data-testid="match-dice">
          {match.dice ?? "まだ振っていません"}
        </span>
        ・残りの歩数:{" "}
        <span data-testid="match-remaining-steps">{match.remainingSteps}</span>
      </p>

      {match.outcome ? (
        <section aria-labelledby="outcome-heading" data-testid="match-outcome">
          <h2 id="outcome-heading">対戦の結果</h2>
          <p>
            勝った人:{" "}
            <span data-testid="match-winners">
              {winnerNames(match.participants, match.outcome.winners)}
            </span>
          </p>
          <p>理由: {MATCH_END_REASON_LABELS[match.outcome.reason]}</p>
        </section>
      ) : mine ? (
        <section aria-labelledby="operations-heading">
          <h2 id="operations-heading">あなたの番です</h2>
          {match.phase === "DRAWING" && (
            <MatchActionButton action={drawMatchCard} {...actionProps}>
              カードを引く
            </MatchActionButton>
          )}
          {match.phase === "DISCARDING" && (
            <ul>
              {(
                match.participants[match.currentParticipant ?? 0]?.hand ?? []
              ).map((card, handIndex) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 同じカードが複数並ぶため、手札の番号で区別する
                <li key={handIndex}>
                  <MatchActionButton
                    action={discardMatchCard}
                    values={{ handIndex }}
                    {...actionProps}
                  >
                    {card.name}を捨てる
                  </MatchActionButton>
                </li>
              ))}
            </ul>
          )}
          {match.phase === "ROLLING" && (
            <MatchActionButton action={rollMatchDice} {...actionProps}>
              サイコロを振る
            </MatchActionButton>
          )}
          {match.phase === "CHOOSING_PATH" && (
            <ul>
              {match.pathChoices.map((position) => (
                <li key={`${position.x},${position.y}`}>
                  <MatchActionButton
                    action={chooseMatchPath}
                    values={{ x: position.x, y: position.y }}
                    {...actionProps}
                  >
                    ({position.x}, {position.y}) へ進む
                  </MatchActionButton>
                </li>
              ))}
            </ul>
          )}
          {match.phase === "ENDING" && (
            <MatchActionButton action={endMatchTurn} {...actionProps}>
              ターンを終える
            </MatchActionButton>
          )}
        </section>
      ) : (
        <p>
          他の参加者（NPC）の番です。{" "}
          {/* Link は同じ URL だと読み直さないことがあるため、普通のリンクで読み込み直す */}
          <a href={`/matches/${match.id}`}>読み直す</a>
        </p>
      )}

      <h2>順番</h2>
      <ol data-testid="match-turn-order">
        {turnOrderNames(match.participants).map((name, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 順番の何番目かで区別する（同じ名前がありうる）
          <li key={index}>{name}</li>
        ))}
      </ol>

      <h2>参加者</h2>
      <ol data-testid="match-participants">
        {match.participants.map((participant, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 席の順で区別する（同じ名前がありうる）
          <li key={index} data-testid="match-participant">
            <p>
              {SEAT_KIND_LABELS[participant.kind]}・{participant.avatar.name}
            </p>
            <dl>
              <dt>魔力</dt>
              <dd data-testid="participant-magic">{participant.magic}</dd>
              <dt>位置</dt>
              <dd data-testid="participant-position">
                ({participant.position.x}, {participant.position.y})
              </dd>
              <dt>通ったチェックポイント</dt>
              <dd data-testid="participant-checkpoints">
                {participant.passedCheckpoints.length}
              </dd>
              <dt>山札の残り</dt>
              <dd data-testid="participant-draw-pile">
                {participant.drawPileCount}
              </dd>
              <dt>手札</dt>
              <dd>
                <ul data-testid="participant-hand">
                  {participant.hand.map((card, cardIndex) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: 同じカードが複数並ぶため、引いた順で区別する
                    <li key={cardIndex}>{card.name}</li>
                  ))}
                </ul>
              </dd>
            </dl>
          </li>
        ))}
      </ol>

      <BoardGrid
        width={match.board.width}
        height={match.board.height}
        tiles={match.board.tiles}
        pairs={match.board.pairs}
        pieces={participantPieces(match.participants)}
      />

      <section aria-labelledby="rules-heading">
        <h2 id="rules-heading">ルール</h2>
        <dl data-testid="match-rules">
          {RULE_FIELDS.map((field) => (
            <Fragment key={field}>
              <dt>{RULE_LABELS[field]}</dt>
              <dd>{match.rules[field]}</dd>
            </Fragment>
          ))}
          <dt>手札の上限</dt>
          <dd>{match.rules.maxHandCards}</dd>
          <dt>配る枚数</dt>
          <dd>{match.rules.startingHandCards}</dd>
        </dl>
      </section>
      <p>
        <Link href="/rooms">部屋の一覧へ</Link>
      </p>
    </main>
  );
}
