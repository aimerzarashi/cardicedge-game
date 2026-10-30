import Link from "next/link";
import { Fragment } from "react";
import { graphql } from "@/graphql";
import { callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import { RULE_LABELS, type RuleField } from "../../messages";
import { BoardGrid } from "../board-grid";

const boardQuery = graphql(`
  query Board($id: UUID!) {
    board(id: $id) {
      __typename
      ... on Board {
        id
        name
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
        defaultRules {
          targetMagic
          startingMagic
          lapBonus
          checkpointBonus
        }
      }
    }
  }
`);

// 形の違う ID を core に渡すと GraphQL の誤りになり、想定外として扱われるため、形だけを確かめる
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function NotFound() {
  return (
    <main>
      <h1>ボード</h1>
      <p role="alert">このボードは見つかりません</p>
      <p>
        <Link href="/boards">ボードの一覧へ</Link>
      </p>
    </main>
  );
}

export default async function BoardPage({ params }: PageProps<"/boards/[id]">) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return <NotFound />;
  }

  // 未登録のプレイヤーは core の board が PlayerNotRegisteredError を返すため、先に登録を済ませる
  const player = await currentPlayer();
  const result = player.ok ? await callCore(boardQuery, { id }) : player;
  if (!result.ok) {
    return (
      <main>
        <h1>ボード</h1>
        <p role="alert">
          core に接続できません。時間をおいて再読み込みしてください。{" "}
          <Link href={`/boards/${id}`}>再読み込み</Link>
        </p>
      </main>
    );
  }
  const board = result.data.board;
  switch (board.__typename) {
    case "BoardNotFoundError":
      return <NotFound />;
    case "PlayerNotRegisteredError":
      // 登録の直後に未登録のままなのは、core の不具合（想定外）
      throw new Error("player is not registered after registerPlayer");
    case "Board":
      break;
  }

  return (
    <main>
      <h1>{board.name}</h1>
      <dl>
        <dt>大きさ</dt>
        <dd>
          {board.width}×{board.height}
        </dd>
      </dl>
      <BoardGrid
        width={board.width}
        height={board.height}
        tiles={board.tiles}
        pairs={board.pairs}
      />
      <section aria-labelledby="rules-heading">
        <h2 id="rules-heading">既定のルール</h2>
        <p>対戦を始めるときに変えられる、既定の値です。</p>
        <dl>
          {(Object.keys(RULE_LABELS) as RuleField[]).map((field) => (
            <Fragment key={field}>
              <dt>{RULE_LABELS[field]}</dt>
              <dd>{board.defaultRules[field]}</dd>
            </Fragment>
          ))}
        </dl>
      </section>
      <p>
        <Link href="/boards">ボードの一覧へ</Link>
      </p>
    </main>
  );
}
