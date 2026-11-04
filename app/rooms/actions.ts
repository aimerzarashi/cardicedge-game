"use server";

import { redirect } from "next/navigation";
import { callCore } from "@/lib/core";
import {
  CORE_UNAVAILABLE_OPERATION,
  nameErrorMessage,
  roomErrorMessage,
} from "../messages";
import { createRoomMutation } from "./operations";

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
  redirect(`/rooms/${created.id}`);
}
