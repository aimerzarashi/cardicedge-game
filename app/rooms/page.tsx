import Link from "next/link";
import { graphql } from "@/graphql";
import type { MyRoomsQuery } from "@/graphql/graphql";
import { type CoreResult, callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import { first } from "@/lib/search-params";
import { ROOM_REQUIREMENT_STEPS, ROOM_STATUS_LABELS } from "../messages";
import { CreateRoomForm } from "./create-room-form";

const myRoomsQuery = graphql(`
  query MyRooms($after: String) {
    me {
      __typename
      ... on Player {
        roomRequirements
      }
    }
    myRooms(after: $after) {
      __typename
      ... on RoomsConnection {
        edges {
          node {
            id
            name
            status
            seats {
              kind
            }
            matchRules {
              board {
                name
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`);

// 続きは URL に持つ（再読み込み・共有で同じページに戻るため）
function pageURL(after?: string): string {
  return after === undefined
    ? "/rooms"
    : `/rooms?${new URLSearchParams({ after })}`;
}

export default async function RoomsPage({ searchParams }: PageProps<"/rooms">) {
  const params = await searchParams;
  const after = first(params.after);

  // 未登録のプレイヤーは core の myRooms が PlayerNotRegisteredError を返すため、先に登録を済ませる
  const player = await currentPlayer();
  const result = player.ok ? await callCore(myRoomsQuery, { after }) : player;

  // 作れるかは core が答える（足りないものの一覧。画面で数えない）。読めなかったときはフォームを出し、作る操作の結果に任せる
  const requirements =
    result.ok && result.data.me.__typename === "Player"
      ? result.data.me.roomRequirements
      : [];

  return (
    <main>
      <h1>部屋</h1>
      <p>
        <Link href="/">トップへ</Link>
      </p>
      {requirements.length === 0 ? (
        <CreateRoomForm />
      ) : (
        <section data-testid="room-requirements">
          <p>部屋を作る前に、次を済ませてください。</p>
          <ul>
            {requirements.map((requirement) => (
              <li key={requirement}>
                <Link href={ROOM_REQUIREMENT_STEPS[requirement].href}>
                  {ROOM_REQUIREMENT_STEPS[requirement].label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <RoomsResult result={result} after={after} />
    </main>
  );
}

function RoomsResult({
  result,
  after,
}: {
  result: CoreResult<MyRoomsQuery>;
  after?: string;
}) {
  if (!result.ok) {
    return (
      <p role="alert">
        core に接続できません。時間をおいて再読み込みしてください。{" "}
        <Link href={pageURL(after)}>再読み込み</Link>
      </p>
    );
  }
  const rooms = result.data.myRooms;
  switch (rooms.__typename) {
    case "ValidationErrors":
      return (
        <p role="alert">
          条件が正しくありません。 <Link href="/rooms">最初のページへ</Link>
        </p>
      );
    case "PlayerNotRegisteredError":
      // 登録の直後に未登録のままなのは、core の不具合（想定外）
      throw new Error("player is not registered after registerPlayer");
    case "RoomsConnection":
      return (
        <>
          {rooms.edges.length === 0 ? (
            <p>まだ部屋がありません</p>
          ) : (
            <ul data-testid="rooms">
              {rooms.edges.map(({ node }) => (
                <li key={node.id}>
                  <Link href={`/rooms/${node.id}`}>{node.name}</Link>{" "}
                  {ROOM_STATUS_LABELS[node.status]}・席 {node.seats.length}・
                  {node.matchRules?.board.name ?? "ボード未定"}
                </li>
              ))}
            </ul>
          )}
          <p>
            <Link href="/rooms">最初のページへ</Link>
            {rooms.pageInfo.hasNextPage && rooms.pageInfo.endCursor && (
              <>
                {" "}
                <Link href={pageURL(rooms.pageInfo.endCursor)}>次へ</Link>
              </>
            )}
          </p>
        </>
      );
  }
}
