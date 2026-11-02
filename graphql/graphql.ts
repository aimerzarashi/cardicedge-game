/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
/**
 * 土地の属性。土地は必ずどれか 1 つを持つ（火属性の土地・地属性の土地 等）。拠点・チェックポイントは持たない。
 * 効き方（地形効果・連鎖・属性の変更のコスト等）は対戦の決まりで、ここでは決めない
 */
export type BoardTileAttribute =
  /** 地（地属性） */
  | 'EARTH'
  /** 火（火属性） */
  | 'FIRE'
  /** 複（複属性）。火・地・水・風の 4 色のマークが描かれた特殊な土地。組み合わせは持たない（属性の値の 1 つ） */
  | 'MULTI'
  /** 無（無属性） */
  | 'NEUTRAL'
  /** 水（水属性） */
  | 'WATER'
  /** 風（風属性） */
  | 'WIND';

/** カードの種類 */
export type CardType =
  | 'CREATURE'
  | 'ITEM'
  | 'SPELL';

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
    | { __typename: 'Board', id: string, name: string, width: number, height: number, tiles: Array<
        | { __typename: 'BaseTile', x: number, y: number }
        | { __typename: 'BridgeTile', x: number, y: number }
        | { __typename: 'CardShopTile', x: number, y: number }
        | { __typename: 'CheckpointTile', x: number, y: number }
        | { __typename: 'LandTile', attribute: BoardTileAttribute, x: number, y: number }
        | { __typename: 'ProphecyShopTile', x: number, y: number }
        | { __typename: 'SanctuaryTile', x: number, y: number }
        | { __typename: 'ShrineTile', x: number, y: number }
        | { __typename: 'WarpTile', x: number, y: number }
      >, pairs: Array<{ a: { x: number, y: number }, b: { x: number, y: number } }>, defaultRules: { targetMagic: number, startingMagic: number, lapBonus: number, checkpointBonus: number, roundLimit: number, diceMin: number, diceMax: number } }
    | { __typename: 'BoardNotFoundError' }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type BoardsQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type BoardsQuery = { boards:
    | { __typename: 'BoardsConnection', edges: Array<{ node: { id: string, name: string, width: number, height: number, tileCounts: { land: number, base: number, checkpoint: number, fire: number, earth: number, water: number, wind: number, neutral: number, multi: number, warp: number, bridge: number, sanctuary: number, shrine: number, prophecyShop: number, cardShop: number }, defaultRules: { targetMagic: number, startingMagic: number, lapBonus: number, checkpointBonus: number, roundLimit: number, diceMin: number, diceMax: number } } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'ValidationErrors' }
   };

export type NpcAvatarQueryVariables = Exact<{
  id: string;
}>;


export type NpcAvatarQuery = { npcAvatar:
    | { __typename: 'NpcAvatar', id: string, name: string, decks: Array<{ id: string, name: string, totalCount: number, cards: Array<{ count: number, card: { id: string, name: string, type: CardType } }> }> }
    | { __typename: 'NpcAvatarNotFoundError' }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type NpcAvatarsQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type NpcAvatarsQuery = { npcAvatars:
    | { __typename: 'NpcAvatarsConnection', edges: Array<{ node: { id: string, name: string, decks: Array<{ id: string, name: string }> } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } }
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
        roundLimit
        diceMin
        diceMax
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
          tileCounts {
            land
            base
            checkpoint
            fire
            earth
            water
            wind
            neutral
            multi
            warp
            bridge
            sanctuary
            shrine
            prophecyShop
            cardShop
          }
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
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
    `) as unknown as TypedDocumentString<BoardsQuery, BoardsQueryVariables>;
export const NpcAvatarDocument = new TypedDocumentString(`
    query NpcAvatar($id: UUID!) {
  npcAvatar(id: $id) {
    __typename
    ... on NpcAvatar {
      id
      name
      decks {
        id
        name
        totalCount
        cards {
          count
          card {
            id
            name
            type
          }
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<NpcAvatarQuery, NpcAvatarQueryVariables>;
export const NpcAvatarsDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<NpcAvatarsQuery, NpcAvatarsQueryVariables>;
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