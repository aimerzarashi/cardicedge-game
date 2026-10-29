/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation RegisterAvatar($input: RegisterAvatarInput!) {\n    registerAvatar(input: $input) {\n      __typename\n      ... on RegisterAvatarSuccess {\n        avatar {\n          id\n        }\n      }\n      ... on ValidationErrors {\n        errors {\n          __typename\n          ... on FieldTooLong {\n            max\n          }\n        }\n      }\n      ... on AvatarLimitReachedError {\n        max\n      }\n    }\n  }\n": typeof types.RegisterAvatarDocument,
    "\n  query AvatarIds {\n    me {\n      __typename\n      ... on Player {\n        avatars {\n          id\n        }\n      }\n    }\n  }\n": typeof types.AvatarIdsDocument,
    "\n  query Board($id: UUID!) {\n    board(id: $id) {\n      __typename\n      ... on Board {\n        id\n        name\n        width\n        height\n        tiles {\n          __typename\n          x\n          y\n          ... on LandTile {\n            attribute\n          }\n        }\n      }\n    }\n  }\n": typeof types.BoardDocument,
    "\n  query Boards($after: String) {\n    boards(after: $after) {\n      __typename\n      ... on BoardsConnection {\n        edges {\n          node {\n            id\n            name\n            width\n            height\n          }\n        }\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n      }\n    }\n  }\n": typeof types.BoardsDocument,
    "\n  query Me {\n    me {\n      __typename\n      ... on Player {\n        id\n        starterGrant\n        avatars {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.MeDocument,
    "\n  mutation RegisterPlayer {\n    registerPlayer {\n      __typename\n    }\n  }\n": typeof types.RegisterPlayerDocument,
};
const documents: Documents = {
    "\n  mutation RegisterAvatar($input: RegisterAvatarInput!) {\n    registerAvatar(input: $input) {\n      __typename\n      ... on RegisterAvatarSuccess {\n        avatar {\n          id\n        }\n      }\n      ... on ValidationErrors {\n        errors {\n          __typename\n          ... on FieldTooLong {\n            max\n          }\n        }\n      }\n      ... on AvatarLimitReachedError {\n        max\n      }\n    }\n  }\n": types.RegisterAvatarDocument,
    "\n  query AvatarIds {\n    me {\n      __typename\n      ... on Player {\n        avatars {\n          id\n        }\n      }\n    }\n  }\n": types.AvatarIdsDocument,
    "\n  query Board($id: UUID!) {\n    board(id: $id) {\n      __typename\n      ... on Board {\n        id\n        name\n        width\n        height\n        tiles {\n          __typename\n          x\n          y\n          ... on LandTile {\n            attribute\n          }\n        }\n      }\n    }\n  }\n": types.BoardDocument,
    "\n  query Boards($after: String) {\n    boards(after: $after) {\n      __typename\n      ... on BoardsConnection {\n        edges {\n          node {\n            id\n            name\n            width\n            height\n          }\n        }\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n      }\n    }\n  }\n": types.BoardsDocument,
    "\n  query Me {\n    me {\n      __typename\n      ... on Player {\n        id\n        starterGrant\n        avatars {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.MeDocument,
    "\n  mutation RegisterPlayer {\n    registerPlayer {\n      __typename\n    }\n  }\n": types.RegisterPlayerDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RegisterAvatar($input: RegisterAvatarInput!) {\n    registerAvatar(input: $input) {\n      __typename\n      ... on RegisterAvatarSuccess {\n        avatar {\n          id\n        }\n      }\n      ... on ValidationErrors {\n        errors {\n          __typename\n          ... on FieldTooLong {\n            max\n          }\n        }\n      }\n      ... on AvatarLimitReachedError {\n        max\n      }\n    }\n  }\n"): typeof import('./graphql').RegisterAvatarDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AvatarIds {\n    me {\n      __typename\n      ... on Player {\n        avatars {\n          id\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').AvatarIdsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Board($id: UUID!) {\n    board(id: $id) {\n      __typename\n      ... on Board {\n        id\n        name\n        width\n        height\n        tiles {\n          __typename\n          x\n          y\n          ... on LandTile {\n            attribute\n          }\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').BoardDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Boards($after: String) {\n    boards(after: $after) {\n      __typename\n      ... on BoardsConnection {\n        edges {\n          node {\n            id\n            name\n            width\n            height\n          }\n        }\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').BoardsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      __typename\n      ... on Player {\n        id\n        starterGrant\n        avatars {\n          id\n          name\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').MeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RegisterPlayer {\n    registerPlayer {\n      __typename\n    }\n  }\n"): typeof import('./graphql').RegisterPlayerDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
