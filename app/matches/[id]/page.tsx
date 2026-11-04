import Link from "next/link";
import { Fragment } from "react";
import { graphql } from "@/graphql";
import { callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import { BoardGrid } from "../../boards/board-grid";
import { RULE_LABELS, type RuleField, SEAT_KIND_LABELS } from "../../messages";
import {
  currentTurnText,
  participantPieces,
  roundText,
  turnOrderNames,
} from "../match-view";

const matchQuery = graphql(`
  query MatchDetail($id: UUID!) {
    match(id: $id) {
      __typename
      ... on Match {
        id
        round
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

  return (
    <main>
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
