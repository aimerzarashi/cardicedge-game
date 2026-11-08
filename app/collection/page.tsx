import Form from "next/form";
import Link from "next/link";
import { graphql } from "@/graphql";
import type {
  CardType,
  CollectionQuery,
  CollectionQueryVariables,
} from "@/graphql/graphql";
import { type CoreResult, callCore } from "@/lib/core";
import { currentPlayer } from "@/lib/player";
import { all, first } from "@/lib/search-params";
import {
  CARD_TYPE_FILTERS,
  CARD_TYPE_LABELS,
  isCardType,
  RARITY_LABELS,
} from "../messages";

const collectionQuery = graphql(`
  query Collection($filter: CollectionFilter, $after: String) {
    me {
      __typename
      ... on Player {
        collection(filter: $filter, after: $after) {
          __typename
          ... on CollectionCardConnection {
            edges {
              node {
                count
                card {
                  __typename
                  id
                  name
                  cost
                  rarity
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
    }
  }
`);

// 条件は URL に持つ（再読み込み・共有で同じ一覧に戻るため）
function pageURL(types: CardType[], after?: string): string {
  const params = new URLSearchParams();
  for (const type of types) {
    params.append("type", type);
  }
  if (after !== undefined) {
    params.set("after", after);
  }
  const query = params.toString();
  return query === "" ? "/collection" : `/collection?${query}`;
}

export default async function CollectionPage({
  searchParams,
}: PageProps<"/collection">) {
  const params = await searchParams;
  // 形だけを確かめる（知らない値を core に渡すと GraphQL の誤りになり、想定外として扱われるため）
  const types = all(params.type).filter(isCardType);
  const after = first(params.after);

  const variables: CollectionQueryVariables = {
    // 1 つも選ばなければすべての種類（core は空のリストを入力の誤りにするため送らない）
    filter: types.length > 0 ? { types } : null,
    after,
  };
  // 未登録のプレイヤーは core の me が PlayerNotRegisteredError を返すため、先に登録を済ませる
  const player = await currentPlayer();
  const result = player.ok
    ? await callCore(collectionQuery, variables)
    : player;

  return (
    <main>
      <h1>所持カード</h1>
      <p>
        <Link href="/">トップへ</Link>
      </p>
      <Form action="/collection">
        <fieldset>
          <legend>種類</legend>
          {CARD_TYPE_FILTERS.map((type) => (
            <label key={type.value}>
              <input
                type="checkbox"
                name="type"
                value={type.value}
                defaultChecked={types.includes(type.value)}
              />
              {type.label}
            </label>
          ))}
        </fieldset>
        <button type="submit">絞り込む</button>
      </Form>
      <CollectionResult result={result} types={types} />
    </main>
  );
}

function CollectionResult({
  result,
  types,
}: {
  result: CoreResult<CollectionQuery>;
  types: CardType[];
}) {
  if (!result.ok) {
    return (
      <p role="alert">
        core に接続できません。時間をおいて再読み込みしてください。{" "}
        <Link href={pageURL(types)}>再読み込み</Link>
      </p>
    );
  }
  const me = result.data.me;
  if (me.__typename !== "Player") {
    // 登録の直後に未登録のままなのは、core の不具合（想定外）
    throw new Error("player is not registered after registerPlayer");
  }
  const collection = me.collection;
  switch (collection.__typename) {
    case "ValidationErrors":
      return (
        <p role="alert">
          条件が正しくありません。{" "}
          <Link href="/collection">最初のページへ</Link>
        </p>
      );
    case "CollectionCardConnection":
      return (
        <>
          {collection.edges.length === 0 ? (
            <p>カードを持っていません</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>カード名</th>
                  <th>種類</th>
                  <th>コスト</th>
                  <th>希少度</th>
                  <th>枚数</th>
                </tr>
              </thead>
              <tbody>
                {collection.edges.map(({ node: { card, count } }) => (
                  <tr key={card.id}>
                    <td>
                      <Link href={`/cards/${card.id}`}>{card.name}</Link>
                    </td>
                    <td>{CARD_TYPE_LABELS[card.__typename]}</td>
                    <td>{card.cost}</td>
                    <td>{RARITY_LABELS[card.rarity]}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p>
            <Link href={pageURL(types)}>最初のページへ</Link>
            {collection.pageInfo.hasNextPage &&
              collection.pageInfo.endCursor && (
                <>
                  {" "}
                  <Link href={pageURL(types, collection.pageInfo.endCursor)}>
                    次へ
                  </Link>
                </>
              )}
          </p>
        </>
      );
  }
}
