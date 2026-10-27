import Link from "next/link";
import { graphql } from "@/graphql";
import type { BoardsQuery } from "@/graphql/graphql";
import { type CoreResult, callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import { first } from "@/lib/search-params";

const boardsQuery = graphql(`
  query Boards($after: String) {
    boards(after: $after) {
      __typename
      ... on BoardsConnection {
        edges {
          node {
            id
            name
            width
            height
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
    ? "/boards"
    : `/boards?${new URLSearchParams({ after })}`;
}

export default async function BoardsPage({
  searchParams,
}: PageProps<"/boards">) {
  const params = await searchParams;
  const after = first(params.after);

  // 未登録のプレイヤーは core の boards が PlayerNotRegisteredError を返すため、先に登録を済ませる
  const player = await currentPlayer();
  const result = player.ok ? await callCore(boardsQuery, { after }) : player;

  return (
    <main>
      <h1>ボードの一覧</h1>
      <BoardsResult result={result} after={after} />
      <p>
        <Link href="/">トップへ</Link>
      </p>
    </main>
  );
}

function BoardsResult({
  result,
  after,
}: {
  result: CoreResult<BoardsQuery>;
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
  const boards = result.data.boards;
  switch (boards.__typename) {
    case "ValidationErrors":
      return (
        <p role="alert">
          条件が正しくありません。 <Link href="/boards">最初のページへ</Link>
        </p>
      );
    case "PlayerNotRegisteredError":
      // 登録の直後に未登録のままなのは、core の不具合（想定外）
      throw new Error("player is not registered after registerPlayer");
    case "BoardsConnection":
      return (
        <>
          {boards.edges.length === 0 ? (
            <p>ボードがありません</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>名前</th>
                  <th>大きさ</th>
                </tr>
              </thead>
              <tbody>
                {boards.edges.map(({ node }) => (
                  <tr key={node.id}>
                    <td>
                      <Link href={`/boards/${node.id}`}>{node.name}</Link>
                    </td>
                    <td>
                      {node.width}×{node.height}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p>
            <Link href="/boards">最初のページへ</Link>
            {boards.pageInfo.hasNextPage && boards.pageInfo.endCursor && (
              <>
                {" "}
                <Link href={pageURL(boards.pageInfo.endCursor)}>次へ</Link>
              </>
            )}
          </p>
        </>
      );
  }
}
