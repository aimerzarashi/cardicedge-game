"use server";

import { redirect } from "next/navigation";
import { callCore } from "@/lib/core";
import {
  CORE_UNAVAILABLE_OPERATION,
  NOT_REFLECTED,
  nameErrorMessage,
  roomErrorMessage,
} from "../messages";
import { createRoomMutation } from "./operations";
import { waitRoom } from "./wait-room";

export type CreateRoomState = {
  // 入力欄に入れておく値（誤りのときは入力した値を残す）
  value: string;
  nameError?: string;
  error?: string;
};

export async function createRoom(
  _previous: CreateRoomState,
  form: FormData,
): Promise<CreateRoomState> {
  // 中身の正誤は core が判定するため、ここでは形（文字列であること）だけを確かめる
  const name = form.get("name");
  if (typeof name !== "string") {
    return { value: "", nameError: "名前を入力してください" };
  }
  const result = await callCore(createRoomMutation, { input: { name } });
  if (!result.ok) {
    return { value: name, error: CORE_UNAVAILABLE_OPERATION };
  }
  const created = result.data.createRoom;
  if (created.__typename === "ValidationErrors") {
    return { value: name, nameError: nameErrorMessage(created.errors) };
  }
  if (created.__typename !== "CreateRoomSuccess") {
    return { value: name, error: roomErrorMessage(created.__typename) };
  }
  // 詳細は投影から読むため、作った直後に移ると「見つかりません」になりうる。詳細に出るまで待ってから移す。
  // 待ちきれなければ作れてはいるので、入力を空にして、反映を待つよう知らせる（一覧に出てから開ける）
  if ((await waitRoom(created.id, created.revision)) === "timeout") {
    return { value: "", error: NOT_REFLECTED };
  }
  redirect(`/rooms/${created.id}`);
}
