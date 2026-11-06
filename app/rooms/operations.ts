// 画面（Server Action・ページ）と tests/ の両方が読むため、server-only や "use server" のファイルには置かない
// （"use server" のファイルは非同期の関数しか export できず、server-only はテストの Node から読めない）。
// 操作の名前は全体で一意にする（codegen の決まり）
import { graphql } from "@/graphql";

export const createRoomMutation = graphql(`
  mutation CreateRoom($input: CreateRoomInput!) {
    createRoom(input: $input) {
      __typename
      ... on CreateRoomSuccess {
        id
      }
      ... on ValidationErrors {
        errors {
          __typename
          ... on FieldTooLong {
            max
          }
        }
      }
    }
  }
`);

export const renameRoomMutation = graphql(`
  mutation RenameRoom($input: RenameRoomInput!) {
    renameRoom(input: $input) {
      __typename
      ... on ValidationErrors {
        errors {
          __typename
          field
          ... on FieldTooLong {
            max
          }
        }
      }
    }
  }
`);

// 項目ごとの誤り（ValidationErrors）の中身は、どの操作でも同じ項目を読む。codegen は静的な文字列しか読めず、
// テンプレートで共通にできないため、操作ごとに書く
export const changeRoomSeatsMutation = graphql(`
  mutation ChangeRoomSeats($input: ChangeRoomSeatsInput!) {
    changeRoomSeats(input: $input) {
      __typename
      ... on ValidationErrors {
        errors {
          __typename
          field
          ... on FieldOutOfRange {
            min
            max
          }
          ... on FieldTooSmall {
            min
          }
          ... on FieldCountMismatch {
            expected
          }
          ... on FieldNotGreaterThan {
            than
          }
        }
      }
    }
  }
`);

export const changeRoomMatchRulesMutation = graphql(`
  mutation ChangeRoomMatchRules($input: ChangeRoomMatchRulesInput!) {
    changeRoomMatchRules(input: $input) {
      __typename
      ... on ValidationErrors {
        errors {
          __typename
          field
          ... on FieldOutOfRange {
            min
            max
          }
          ... on FieldTooSmall {
            min
          }
          ... on FieldCountMismatch {
            expected
          }
          ... on FieldNotGreaterThan {
            than
          }
        }
      }
    }
  }
`);

export const changeRoomSeatChoiceMutation = graphql(`
  mutation ChangeRoomSeatChoice($input: ChangeRoomSeatChoiceInput!) {
    changeRoomSeatChoice(input: $input) {
      __typename
      ... on ValidationErrors {
        errors {
          __typename
          field
          ... on FieldOutOfRange {
            min
            max
          }
          ... on FieldTooSmall {
            min
          }
          ... on FieldCountMismatch {
            expected
          }
          ... on FieldNotGreaterThan {
            than
          }
        }
      }
    }
  }
`);

export const publishRoomMutation = graphql(`
  mutation PublishRoom($input: PublishRoomInput!) {
    publishRoom(input: $input) {
      __typename
    }
  }
`);

export const declareRoomReadyMutation = graphql(`
  mutation DeclareRoomReady($input: DeclareRoomReadyInput!) {
    declareRoomReady(input: $input) {
      __typename
    }
  }
`);

// 結果の型ごとの文言は messages.ts の roomErrorMessage で作る（成功は Success で終わる型）
export const declareRoomNextMutation = graphql(`
  mutation DeclareRoomNext($input: DeclareRoomNextInput!) {
    declareRoomNext(input: $input) {
      __typename
    }
  }
`);

// 休止中の部屋を再開し、準備中に戻す（作った人だけ）
export const resumeRoomMutation = graphql(`
  mutation ResumeRoom($input: ResumeRoomInput!) {
    resumeRoom(input: $input) {
      __typename
    }
  }
`);

export const closeRoomMutation = graphql(`
  mutation CloseRoom($input: CloseRoomInput!) {
    closeRoom(input: $input) {
      __typename
    }
  }
`);

// 準備完了のあと、対戦が始まっているかを確かめる
export const roomMatchQuery = graphql(`
  query RoomMatch($id: UUID!) {
    room(id: $id) {
      __typename
      ... on Room {
        match {
          id
        }
      }
    }
  }
`);
