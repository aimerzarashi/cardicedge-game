import Link from "next/link";
import { graphql } from "@/graphql";
import type { NpcAvatarsQuery } from "@/graphql/graphql";
import { type CoreResult, callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import { first } from "@/lib/search-params";

const npcAvatarsQuery = graphql(`
  query NpcAvatars($after: String) {
    npcAvatars(after: $after) {
      __typename
      ... on NpcAvatarsConnection {
        edges {
          node {
            id
            name
            decks {
              id
              name
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
    ? "/npc-avatars"
    : `/npc-avatars?${new URLSearchParams({ after })}`;
}

export default async function NpcAvatarsPage({
  searchParams,
}: PageProps<"/npc-avatars">) {
  const params = await searchParams;
  const after = first(params.after);

  // 未登録のプレイヤーは core の npcAvatars が PlayerNotRegisteredError を返すため、先に登録を済ませる
  const player = await currentPlayer();
  const result = player.ok
    ? await callCore(npcAvatarsQuery, { after })
    : player;

  return (
    <main>
      <h1>NPC の一覧</h1>
      <NpcAvatarsResult result={result} after={after} />
      <p>
        <Link href="/">トップへ</Link>
      </p>
    </main>
  );
}

function NpcAvatarsResult({
  result,
  after,
}: {
  result: CoreResult<NpcAvatarsQuery>;
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
  const avatars = result.data.npcAvatars;
  switch (avatars.__typename) {
    case "ValidationErrors":
      return (
        <p role="alert">
          条件が正しくありません。{" "}
          <Link href="/npc-avatars">最初のページへ</Link>
        </p>
      );
    case "PlayerNotRegisteredError":
      // 登録の直後に未登録のままなのは、core の不具合（想定外）
      throw new Error("player is not registered after registerPlayer");
    case "NpcAvatarsConnection":
      return (
        <>
          {avatars.edges.length === 0 ? (
            <p>NPC がいません</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>名前</th>
                  <th>使うデッキ</th>
                </tr>
              </thead>
              <tbody>
                {avatars.edges.map(({ node }) => (
                  <tr key={node.id}>
                    <td>
                      <Link href={`/npc-avatars/${node.id}`}>{node.name}</Link>
                    </td>
                    <td>{node.decks.map((deck) => deck.name).join("、")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p>
            <Link href="/npc-avatars">最初のページへ</Link>
            {avatars.pageInfo.hasNextPage && avatars.pageInfo.endCursor && (
              <>
                {" "}
                <Link href={pageURL(avatars.pageInfo.endCursor)}>次へ</Link>
              </>
            )}
          </p>
        </>
      );
  }
}
