/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
/** マスの種類 */
export type BoardTileKind =
  /** 拠点 */
  | 'BASE'
  /** チェックポイント */
  | 'CHECKPOINT'
  /** 土地（ふつうのマス） */
  | 'LAND';

/** アバターを作る入力 */
export type RegisterAvatarInput = {
  /** 名前（前後の空白を除いて 1 文字以上。長さの上限は ValidationErrors の FieldTooLong の max で返す） */
  name: string;
};

/** スターターの配布の状態 */
export type StarterGrantStatus =
  /** 所持カードとデッキがそろった */
  | 'COMPLETED'
  /** まだ届いていない（登録の直後で配布が始まっていない・配っている途中を含む） */
  | 'IN_PROGRESS';

export type RegisterAvatarMutationVariables = Exact<{
  input: RegisterAvatarInput;
}>;


export type RegisterAvatarMutation = { registerAvatar:
    | { __typename: 'AvatarLimitReachedError', max: number }
    | { __typename: 'AvatarNameAlreadyInUseError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RegisterAvatarSuccess', avatar: { id: string } }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldInvalidFormat' }
        | { __typename: 'FieldOutOfRange' }
        | { __typename: 'FieldRequired' }
        | { __typename: 'FieldTooLong', max: number }
      > }
   };

export type AvatarIdsQueryVariables = Exact<{ [key: string]: never; }>;


export type AvatarIdsQuery = { me:
    | { __typename: 'Player', avatars: Array<{ id: string }> }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type BoardQueryVariables = Exact<{
  id: string;
}>;


export type BoardQuery = { board:
    | { __typename: 'Board', id: string, name: string, width: number, height: number, tiles: Array<{ x: number, y: number, kind: BoardTileKind }>, connections: Array<{ a: { x: number, y: number }, b: { x: number, y: number } }> }
    | { __typename: 'BoardNotFoundError' }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type BoardsQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type BoardsQuery = { boards:
    | { __typename: 'BoardsConnection', edges: Array<{ node: { id: string, name: string, width: number, height: number } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'ValidationErrors' }
   };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me:
    | { __typename: 'Player', id: string, starterGrant: StarterGrantStatus, avatars: Array<{ id: string, name: string }> }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type RegisterPlayerMutationVariables = Exact<{ [key: string]: never; }>;


export type RegisterPlayerMutation = { registerPlayer: { __typename: 'RegisterPlayerSuccess' } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const RegisterAvatarDocument = new TypedDocumentString(`
    mutation RegisterAvatar($input: RegisterAvatarInput!) {
  registerAvatar(input: $input) {
    __typename
    ... on RegisterAvatarSuccess {
      avatar {
        id
      }
    }
    ... on ValidationErrors {
      errors {
        __typename
        ... on FieldTooLong {
          max
        }
      }
    }
    ... on AvatarLimitReachedError {
      max
    }
  }
}
    `) as unknown as TypedDocumentString<RegisterAvatarMutation, RegisterAvatarMutationVariables>;
export const AvatarIdsDocument = new TypedDocumentString(`
    query AvatarIds {
  me {
    __typename
    ... on Player {
      avatars {
        id
      }
    }
  }
}
    `) as unknown as TypedDocumentString<AvatarIdsQuery, AvatarIdsQueryVariables>;
export const BoardDocument = new TypedDocumentString(`
    query Board($id: UUID!) {
  board(id: $id) {
    __typename
    ... on Board {
      id
      name
      width
      height
      tiles {
        x
        y
        kind
      }
      connections {
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
  }
}
    `) as unknown as TypedDocumentString<BoardQuery, BoardQueryVariables>;
export const BoardsDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<BoardsQuery, BoardsQueryVariables>;
export const MeDocument = new TypedDocumentString(`
    query Me {
  me {
    __typename
    ... on Player {
      id
      starterGrant
      avatars {
        id
        name
      }
    }
  }
}
    `) as unknown as TypedDocumentString<MeQuery, MeQueryVariables>;
export const RegisterPlayerDocument = new TypedDocumentString(`
    mutation RegisterPlayer {
  registerPlayer {
    __typename
  }
}
    `) as unknown as TypedDocumentString<RegisterPlayerMutation, RegisterPlayerMutationVariables>;