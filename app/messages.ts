// core は文言を返さず、理由の型と値だけを返すため、文言はここで作る

export function nameErrorMessage(
  errors: { __typename: string; max?: number }[],
): string {
  return errors
    .map((error) =>
      error.__typename === "FieldTooLong"
        ? `名前は ${error.max} 文字以内で入力してください`
        : "名前を入力してください",
    )
    .join("。");
}

export const NAME_ALREADY_IN_USE =
  "この名前はすでに使われています。全角・半角や大文字・小文字の違いは、同じ名前とみなします";

export function avatarLimitMessage(max: number): string {
  return `アバターは ${max} 体までです`;
}

export const PLAYER_NOT_REGISTERED =
  "プレイヤーが登録されていません。トップを開き直してからもう一度作ってください";

export const CORE_UNAVAILABLE =
  "core に接続できません。時間をおいてもう一度作ってください";
