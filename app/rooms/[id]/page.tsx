import Link from "next/link";
import { graphql } from "@/graphql";
import { callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import {
  ROOM_STATUS_LABELS,
  RULE_LABELS,
  type RuleField,
  SEAT_KIND_LABELS,
} from "../../messages";
import { closeRoom, declareRoomReady, publishRoom } from "./actions";
import { MatchRulesForm } from "./match-rules-form";
import { RenameForm } from "./rename-form";
import { RoomActionButton } from "./room-action-button";
import { SeatChoiceForm } from "./seat-choice-form";
import { SeatsForm } from "./seats-form";

// 選べるもの（ボード・アバター・デッキ・NPC）と人数の範囲は、部屋と一緒に 1 回で読む。ボードの既定のルールは Player.boards に含まれる
const roomQuery = graphql(`
  query RoomDetail($id: UUID!) {
    room(id: $id) {
      __typename
      ... on Room {
        id
        revision
        name
        status
        match {
          id
        }
        capabilities {
          changeSeats
          changeMatchRules
          publish
          declareReady
          close
          rename
        }
        participants {
          playerId
          owner
          ready
        }
        seats {
          kind
          playerId
          choiceChangeable
          avatar {
            id
            name
          }
          deck {
            id
            name
          }
        }
        matchRules {
          board {
            id
            name
          }
          targetMagic
          startingMagic
          lapBonus
          checkpointBonus
          roundLimit
          diceMin
          diceMax
        }
      }
    }
    me {
      __typename
      ... on Player {
        id
        avatars {
          id
          name
        }
        decks {
          id
          name
        }
        boards {
          id
          name
          defaultRules {
            targetMagic
            startingMagic
            lapBonus
            checkpointBonus
            roundLimit
            diceMin
            diceMax
          }
        }
        npcAvatars {
          id
          name
          decks {
            id
            name
          }
        }
      }
    }
    gameRules {
      __typename
      ... on GameRules {
        match {
          minPlayers
          maxPlayers
        }
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
      <h1>部屋</h1>
      <p role="alert">{children}</p>
      <p>
        <Link href="/rooms">部屋の一覧へ</Link>
      </p>
    </main>
  );
}

export default async function RoomPage({ params }: PageProps<"/rooms/[id]">) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return <Message>この部屋は見つかりません</Message>;
  }

  // 未登録のプレイヤーは core の room が PlayerNotRegisteredError を返すため、先に登録を済ませる
  const player = await currentPlayer();
  const result = player.ok ? await callCore(roomQuery, { id }) : player;
  if (!result.ok) {
    return (
      <Message>
        core に接続できません。時間をおいて再読み込みしてください。
      </Message>
    );
  }

  const { room, me, gameRules } = result.data;
  if (room.__typename === "RoomNotFoundError") {
    return <Message>この部屋は見つかりません</Message>;
  }
  if (
    room.__typename !== "Room" ||
    me.__typename !== "Player" ||
    gameRules.__typename !== "GameRules"
  ) {
    // 登録の直後に未登録のままなのは、core の不具合（想定外）
    throw new Error("player is not registered after registerPlayer");
  }

  // 出し分けは、見ている人にできる操作（core が返す capabilities・choiceChangeable）だけで決める。
  // 担当・公開前に決めたものの固定・準備完了の条件を画面で判断すると、決まりが core との 2 か所になる
  const capabilities = room.capabilities;

  const boardOptions = me.boards;
  const playerAvatars = me.avatars.map((avatar) => ({
    ...avatar,
    decks: me.decks,
  }));

  return (
    <main>
      <h1 data-testid="room-name">{room.name}</h1>
      {capabilities?.rename && (
        <RenameForm id={room.id} revision={room.revision} name={room.name} />
      )}
      <p>
        状態:{" "}
        <span data-testid="room-status">{ROOM_STATUS_LABELS[room.status]}</span>
      </p>

      <h2>参加者</h2>
      <ul data-testid="participants">
        {room.participants.map((participant) => (
          <li key={participant.playerId}>
            {participant.playerId === me.id ? "あなた" : "参加者"}
            {participant.owner && "（作った人）"}・
            {participant.ready ? "準備完了" : "未完了"}
          </li>
        ))}
      </ul>

      <h2>席</h2>
      {room.seats.length === 0 ? (
        <p>席の並びがまだ決まっていません</p>
      ) : (
        <ol data-testid="seats">
          {room.seats.map((seat, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 席は番号で区別する（席の並びの何番目か）
            <li key={index}>
              {SEAT_KIND_LABELS[seat.kind]}・アバター:{" "}
              {seat.avatar?.name ?? "未定"}・デッキ: {seat.deck?.name ?? "未定"}
              {seat.choiceChangeable && (
                <SeatChoiceForm
                  id={room.id}
                  revision={room.revision}
                  seat={index}
                  avatars={
                    seat.kind === "PLAYER" ? playerAvatars : me.npcAvatars
                  }
                  currentAvatarId={seat.avatar?.id}
                  currentDeckId={seat.deck?.id}
                />
              )}
            </li>
          ))}
        </ol>
      )}
      {capabilities?.changeSeats && (
        <SeatsForm
          id={room.id}
          revision={room.revision}
          min={gameRules.match.minPlayers}
          max={gameRules.match.maxPlayers}
          current={room.seats.length}
        />
      )}

      <h2>対戦ルール</h2>
      {room.matchRules ? (
        <p data-testid="match-rules">
          ボード: {room.matchRules.board.name}・
          {RULE_FIELDS.map(
            (field) => `${RULE_LABELS[field]} ${room.matchRules?.[field]}`,
          ).join("・")}
        </p>
      ) : (
        <p>対戦ルールがまだ決まっていません</p>
      )}
      {capabilities?.changeMatchRules && (
        <MatchRulesForm
          id={room.id}
          revision={room.revision}
          boards={boardOptions}
          current={
            room.matchRules
              ? { boardId: room.matchRules.board.id, ...room.matchRules }
              : null
          }
        />
      )}

      {capabilities?.publish && (
        <RoomActionButton
          action={publishRoom}
          id={room.id}
          revision={room.revision}
        >
          公開する
        </RoomActionButton>
      )}
      {capabilities?.declareReady && (
        <RoomActionButton
          action={declareRoomReady}
          id={room.id}
          revision={room.revision}
        >
          準備完了
        </RoomActionButton>
      )}
      {capabilities?.close && (
        <RoomActionButton
          action={closeRoom}
          id={room.id}
          revision={room.revision}
        >
          部屋を閉じる
        </RoomActionButton>
      )}
      {room.match && (
        // 準備完了のあと対戦の画面へ移るが、対戦の投影が追いついていなかったときの行き先
        <p>
          <Link href={`/matches/${room.match.id}`}>対戦の画面へ</Link>
        </p>
      )}
      <p>
        <Link href="/rooms">部屋の一覧へ</Link>
      </p>
    </main>
  );
}
