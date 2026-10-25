/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
/** スターターの配布の状態 */
export type StarterGrantStatus =
  /** 所持カードとデッキがそろった */
  | 'COMPLETED'
  /** まだ届いていない（登録の直後で配布が始まっていない・配っている途中を含む） */
  | 'IN_PROGRESS';

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me:
    | { __typename: 'Player', id: string, starterGrant: StarterGrantStatus }
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

export const MeDocument = new TypedDocumentString(`
    query Me {
  me {
    __typename
    ... on Player {
      id
      starterGrant
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