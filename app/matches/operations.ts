// 画面（Server Action・ページ）が読むため、"use server" のファイルには置かない（部屋の operations.ts と同じ）。
// 操作の名前は全体で一意にする（codegen の決まり）
import { graphql } from "@/graphql";

export const drawMatchCardMutation = graphql(`
  mutation DrawMatchCard($input: DrawMatchCardInput!) {
    drawMatchCard(input: $input) {
      __typename
    }
  }
`);

export const discardMatchCardMutation = graphql(`
  mutation DiscardMatchCard($input: DiscardMatchCardInput!) {
    discardMatchCard(input: $input) {
      __typename
      ... on ValidationErrors {
        errors {
          __typename
          field
          ... on FieldOutOfRange {
            min
            max
          }
        }
      }
    }
  }
`);

export const rollMatchDiceMutation = graphql(`
  mutation RollMatchDice($input: RollMatchDiceInput!) {
    rollMatchDice(input: $input) {
      __typename
    }
  }
`);

export const chooseMatchPathMutation = graphql(`
  mutation ChooseMatchPath($input: ChooseMatchPathInput!) {
    chooseMatchPath(input: $input) {
      __typename
      ... on ValidationErrors {
        errors {
          __typename
          field
          ... on FieldOutOfRange {
            min
            max
          }
        }
      }
    }
  }
`);

export const endMatchTurnMutation = graphql(`
  mutation EndMatchTurn($input: EndMatchTurnInput!) {
    endMatchTurn(input: $input) {
      __typename
    }
  }
`);
