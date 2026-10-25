"use server";

import { refresh } from "next/cache";
import { graphql } from "@/graphql";
import { callCore } from "@/lib/core";
import {
  avatarLimitMessage,
  CORE_UNAVAILABLE,
  NAME_ALREADY_IN_USE,
  nameErrorMessage,
  PLAYER_NOT_REGISTERED,
} from "../messages";
import { waitAvatar } from "./wait-avatar";

const registerAvatarMutation = graphql(`
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
`);

export type RegisterAvatarState = {
  // 入力欄に入れておく値（誤りのときは入力した値を残す）
  value: string;
  // 作れたが、一覧に出るのを待ちきれなかったとき
  registered?: boolean;
  // 入力欄の誤り
  nameError?: string;
  // 入力欄に結びつかない誤り
  error?: string;
};

export async function registerAvatar(
  _previous: RegisterAvatarState,
  form: FormData,
): Promise<RegisterAvatarState> {
  // 中身の正誤は core が判定するため、ここでは形（文字列であること）だけを確かめる
  const name = form.get("name");
  if (typeof name !== "string") {
    return { value: "", nameError: "名前を入力してください" };
  }

  const result = await callCore(registerAvatarMutation, { input: { name } });
  if (!result.ok) {
    return { value: name, error: CORE_UNAVAILABLE };
  }

  const registered = result.data.registerAvatar;
  switch (registered.__typename) {
    case "RegisterAvatarSuccess":
      if ((await waitAvatar(registered.avatar.id)) === "timeout") {
        return { value: "", registered: true };
      }
      // 一覧に出た状態で /avatars を出し直す
      refresh();
      return { value: "" };
    case "ValidationErrors":
      return { value: name, nameError: nameErrorMessage(registered.errors) };
    case "AvatarNameAlreadyInUseError":
      return { value: name, nameError: NAME_ALREADY_IN_USE };
    case "AvatarLimitReachedError":
      return { value: name, error: avatarLimitMessage(registered.max) };
    case "PlayerNotRegisteredError":
      return { value: name, error: PLAYER_NOT_REGISTERED };
  }
}
