import Link from "next/link";
import { graphql } from "@/graphql";
import { callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import { participantColor } from "../../boards/board-paint";
import {
  elementsLabel,
  MATCH_END_REASON_LABELS,
  MATCH_PHASE_LABELS,
  MATCH_REVIEW_MESSAGES,
  matchNumberLabel,
  RARITY_LABELS,
  RULE_LABELS,
  type RuleField,
  SEAT_KIND_LABELS,
} from "../../messages";
import {
  currentTurnText,
  isMyTurn,
  participantPieces,
  participantRows,
  reviewRows,
  roundText,
  territoryMarks,
  winnerNames,
} from "../match-view";
import {
  chooseMatchPath,
  chooseMatchRewardPack,
  deployMatchCreature,
  discardMatchCard,
  drawMatchCard,
  endMatchTurn,
  relinquishMatchTerritory,
  rollMatchDice,
} from "./actions";
import { MatchActionButton } from "./match-action-button";
import { MatchLive, NpcTurnNotice } from "./match-live";

const matchQuery = graphql(`
  query MatchDetail($id: UUID!) {
    match(id: $id) {
      __typename
      ... on Match {
        id
        roomId
        number
        revision
        round
        phase
        dice
        remainingSteps
        pathChoices {
          x
          y
        }
        deployChoices
        relinquishChoices {
          x
          y
        }
        territories {
          position {
            x
            y
          }
          owner
          level
          value
          toll
          relinquishMagic
          creature {
            id
            hitPoints
            card {
              id
              name
            }
          }
        }
        outcome {
          winners
          reason
          ranks
        }
        rewardPacks {
          key
          name
        }
        rules {
          targetMagic
          startingMagic
          lapBonus
          checkpointBonus
          roundLimit
          diceMin
          diceMax
          baseLandValue
          maxHandCards
          startingHandCards
          tollPercentage
          relinquishPercentage
        }
        board {
          width
          height
          tiles {
            __typename
            x
            y
            ... on LandTile {
              element
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
          totalMagic
          hand {
            __typename
            id
            name
            cost
            rarity
            ... on CreatureCardInfo {
              elements
              attack
              hitPoints
            }
          }
          drawPileCount
          turnOrder
          passedCheckpoints {
            x
            y
          }
          rewardReceived
          rewardCards {
            name
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

const LIST_STYLE = { margin: 0, padding: 0, listStyle: "none" } as const;
const STATS_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.25rem 1rem",
  margin: 0,
} as const;
const RULES_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.25rem 1rem",
  margin: 0,
} as const;
const ROW_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "0.25rem 1rem",
  margin: "0 0 0.5rem",
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

const RULE_FIELDS = Object.keys(RULE_LABELS) as RuleField[];

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
      <h1>
        対戦
        {match.number !== null && match.number !== undefined && (
          <>
            {" "}
            <span data-testid="match-number">
              {matchNumberLabel(match.number)}
            </span>
          </>
        )}
      </h1>
      {/* ほかの画面へのリンクは、中身の長さで位置が変わらないよう見出しの下に置く（右の列の下の「描画したイベント」は進むたびに伸び、
          振り返りは戦利品を選ぶと伸びる）。roomId は投影の遅れの間は null のため、そのときは部屋の一覧へだけ */}
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
        {"・"}
        <Link href={`/matches/${match.id}/debug`}>デバッグの画面へ</Link>
      </p>
      <MatchLive
        id={match.id}
        revision={match.revision}
        names={match.participants.map((participant) => participant.avatar.name)}
        board={{
          width: match.board.width,
          height: match.board.height,
          tiles: match.board.tiles,
          pairs: match.board.pairs,
          territories: territoryMarks(match.territories),
        }}
        pieces={participantPieces(match.participants)}
      >
        <div>
          <div style={ROW_STYLE}>
            <span data-testid="match-round">
              {roundText(match.round, match.rules.roundLimit)}
            </span>
            <span>
              今の番:{" "}
              <span data-testid="match-current">
                {currentTurnText(match.participants, match.currentParticipant)}
              </span>
            </span>
            <span>
              段階:{" "}
              <span data-testid="match-phase">
                {MATCH_PHASE_LABELS[match.phase]}
              </span>
            </span>
            <span>
              サイコロの目:{" "}
              <span data-testid="match-dice">
                {match.dice ?? "まだ振っていません"}
              </span>
            </span>
            <span>
              残りの歩数:{" "}
              <span data-testid="match-remaining-steps">
                {match.remainingSteps}
              </span>
            </span>
          </div>

          {match.outcome ? (
            <div data-testid="match-outcome">
              <div style={ROW_STYLE}>
                <strong>対戦の結果</strong>
                <span>
                  勝った人:{" "}
                  <span data-testid="match-winners">
                    {winnerNames(match.participants, match.outcome.winners)}
                  </span>
                </span>
                <span>
                  理由: {MATCH_END_REASON_LABELS[match.outcome.reason]}
                </span>
                <span data-testid="match-rounds">
                  {MATCH_REVIEW_MESSAGES.rounds(match.round)}
                </span>
              </div>
              <ol data-testid="match-review" style={LIST_STYLE}>
                {reviewRows(match.participants, match.outcome.ranks).map(
                  (row) => (
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
                  ),
                )}
              </ol>
              {match.rewardPacks.length > 0 && (
                <div style={ROW_STYLE}>
                  {match.rewardPacks.map((pack) => (
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
              )}
            </div>
          ) : mine ? (
            <div style={ROW_STYLE}>
              <strong>あなたの番です</strong>
              {match.phase === "DRAWING" && (
                <MatchActionButton action={drawMatchCard} {...actionProps}>
                  カードを引く
                </MatchActionButton>
              )}
              {match.phase === "DISCARDING" &&
                (
                  match.participants[match.currentParticipant ?? 0]?.hand ?? []
                ).map((card, handIndex) => (
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
              {match.phase === "ROLLING" && (
                <MatchActionButton action={rollMatchDice} {...actionProps}>
                  サイコロを振る
                </MatchActionButton>
              )}
              {match.phase === "CHOOSING_PATH" &&
                match.pathChoices.map((position) => (
                  <MatchActionButton
                    key={`${position.x},${position.y}`}
                    action={chooseMatchPath}
                    values={{ x: position.x, y: position.y }}
                    {...actionProps}
                  >
                    ({position.x}, {position.y}) へ進む
                  </MatchActionButton>
                ))}
              {match.phase === "DEPLOYING" &&
                match.deployChoices.map((handIndex) => (
                  <MatchActionButton
                    key={handIndex}
                    action={deployMatchCreature}
                    values={{ handIndex }}
                    {...actionProps}
                  >
                    {match.participants[match.currentParticipant ?? 0]?.hand[
                      handIndex
                    ]?.name ?? ""}
                    を配置する
                  </MatchActionButton>
                ))}
              {match.phase === "DEPLOYING" && (
                // 配置しないのは、ターンを終えること（core に専用の操作は無い）
                <MatchActionButton action={endMatchTurn} {...actionProps}>
                  配置せずにターンを終える
                </MatchActionButton>
              )}
              {match.phase === "RELINQUISHING" &&
                match.relinquishChoices.map((position) => {
                  const territory = match.territories.find(
                    (candidate) =>
                      candidate.position.x === position.x &&
                      candidate.position.y === position.y,
                  );
                  return (
                    <MatchActionButton
                      key={`${position.x},${position.y}`}
                      action={relinquishMatchTerritory}
                      values={{ x: position.x, y: position.y }}
                      {...actionProps}
                    >
                      ({position.x}, {position.y}) の
                      {territory?.creature.card.name}を手放す（魔力 +
                      {territory?.relinquishMagic}）
                    </MatchActionButton>
                  );
                })}
              {match.phase === "ENDING" && (
                <MatchActionButton action={endMatchTurn} {...actionProps}>
                  ターンを終える
                </MatchActionButton>
              )}
            </div>
          ) : (
            <NpcTurnNotice id={match.id} />
          )}

          <h2>参加者</h2>
          <ul data-testid="match-participants" style={LIST_STYLE}>
            {participantRows(match.participants, match.currentParticipant).map(
              (row) => {
                const participant = match.participants[row.seat];
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
                        <strong data-testid="match-current-mark">
                          （今の番）
                        </strong>
                      )}
                    </p>
                    <dl style={STATS_STYLE}>
                      <div style={PAIR_STYLE}>
                        <dt>魔力</dt>
                        <dd
                          style={{ margin: 0 }}
                          data-testid="participant-magic"
                        >
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
                        <dt style={{ flexShrink: 0 }}>手札</dt>
                        <dd style={{ margin: 0 }}>
                          <ul data-testid="participant-hand" style={HAND_STYLE}>
                            {participant.hand.map((card, cardIndex) => (
                              // biome-ignore lint/suspicious/noArrayIndexKey: 同じカードが複数並ぶため、引いた順で区別する
                              <li key={cardIndex}>
                                <Link href={`/cards/${card.id}`}>
                                  {card.name}
                                </Link>
                                （コスト {card.cost}・
                                {RARITY_LABELS[card.rarity]}
                                {card.__typename === "CreatureCardInfo" &&
                                  `・${elementsLabel(card.elements)}・AT ${card.attack}・HP ${card.hitPoints}`}
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

          <h2>領地</h2>
          {match.territories.length === 0 ? (
            <p>まだ領地はありません</p>
          ) : (
            <ul data-testid="match-territories">
              {match.territories.map((territory) => (
                <li key={territory.creature.id}>
                  <ParticipantColorMark seat={territory.owner} />
                  {territory.creature.id} ({territory.position.x},{" "}
                  {territory.position.y}) コマ {territory.owner + 1}（
                  {match.participants[territory.owner]?.avatar.name}）:{" "}
                  <Link href={`/cards/${territory.creature.card.id}`}>
                    {territory.creature.card.name}
                  </Link>
                  （HP {territory.creature.hitPoints}）レベル {territory.level}
                  ・価値 {territory.value}・通行料 {territory.toll}
                </li>
              ))}
            </ul>
          )}

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
        </div>
      </MatchLive>
    </main>
  );
}
