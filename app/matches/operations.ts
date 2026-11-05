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

export const chooseMatchRewardPackMutation = graphql(`
  mutation ChooseMatchRewardPack($input: ChooseMatchRewardPackInput!) {
    chooseMatchRewardPack(input: $input) {
      __typename
      ... on ValidationErrors {
        errors {
          __typename
          field
        }
      }
    }
  }
`);

// 差分の読み込み。種類ごとに持つ項目が違うため、画面が使うものだけをインラインフラグメントで読む
export const matchEventsQuery = graphql(`
  query MatchEvents($id: UUID!, $after: Int!) {
    matchEvents(id: $id, after: $after) {
      __typename
      ... on MatchEventList {
        events {
          __typename
          revision
          ... on MatchHandsDealtEvent {
            cards
          }
          ... on MatchTurnOrderDecidedEvent {
            order
          }
          ... on MatchCardDrawnEvent {
            participant
            card {
              name
            }
          }
          ... on MatchCardDiscardedEvent {
            participant
            card {
              name
            }
          }
          ... on MatchDiceRolledEvent {
            participant
            value
          }
          ... on MatchMovedEvent {
            participant
            to {
              x
              y
            }
          }
          ... on MatchCheckpointPassedEvent {
            participant
            checkpoint {
              x
              y
            }
            magic
          }
          ... on MatchLapCompletedEvent {
            participant
            magic
          }
          ... on MatchTurnEndedEvent {
            participant
          }
          ... on MatchEndedEvent {
            winners
            reason
          }
          ... on MatchRewardDrawnEvent {
            participant
            rewardCards {
              name
            }
          }
        }
      }
    }
  }
`);
