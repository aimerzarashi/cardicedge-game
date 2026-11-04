// core は文言を返さず、理由の型と値だけを返すため、文言はここで作る

import type { CardType, RoomStatus } from "@/graphql/graphql";

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

// ボードの既定のルールの項目の呼び方（core の項目名から）
export const RULE_LABELS = {
  targetMagic: "目標の魔力",
  startingMagic: "開始時の魔力",
  lapBonus: "周回のボーナス",
  checkpointBonus: "チェックポイントのボーナス",
  roundLimit: "ラウンドの上限",
  diceMin: "サイコロの目（最小）",
  diceMax: "サイコロの目（最大）",
} as const;
export type RuleField = keyof typeof RULE_LABELS;

// 魔力の 100 刻みは入力のしやすさのための表示の都合の値で、core の決まりではない（studio の ruleStep と同じ）。魔力でない項目は 1 刻み
export function ruleStep(field: RuleField): number {
  switch (field) {
    case "roundLimit":
    case "diceMin":
    case "diceMax":
      return 1;
    default:
      return 100;
  }
}

// カードの種類の呼び方（studio の lib/card-type.ts と同じ）。Record<string, string> にしないのは、種類が core に加わったときに
// 足し忘れると、型検査に引っかからず種類の欄が黙って空になるため
export const CARD_TYPE_LABELS: Record<CardType, string> = {
  CREATURE: "クリーチャー",
  ITEM: "アイテム",
  SPELL: "スペル",
};

// 状態を足し忘れると型検査で止まるよう、core の状態の型で持つ（CARD_TYPE_LABELS と同じ）
export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  DRAFT: "公開前",
  PREPARING: "準備中",
  PLAYING: "対戦中",
  CLOSED: "閉じた",
};

export const SEAT_KIND_LABELS = {
  PLAYER: "プレイヤー",
  NPC: "NPC",
} as const;

// 部屋の操作の項目名（core の field）の呼び方
const ROOM_FIELD_LABELS: Record<string, string> = {
  ...RULE_LABELS,
  seats: "席",
  seat: "席",
  boardId: "ボード",
  avatarId: "アバター",
  deckId: "デッキ",
};

export type FieldErrorValue = {
  __typename: string;
  field: string;
  min?: number;
  max?: number;
  expected?: number;
  than?: string;
};

export function fieldErrorMessage(error: FieldErrorValue): string {
  const label = ROOM_FIELD_LABELS[error.field] ?? error.field;
  const than = error.than ? (ROOM_FIELD_LABELS[error.than] ?? error.than) : "";
  switch (error.__typename) {
    case "FieldOutOfRange":
      return `${label}の数は ${error.min} 以上 ${error.max} 以下にしてください`;
    case "FieldCountMismatch":
      return `プレイヤーの${label}は ${error.expected} つにしてください`;
    case "FieldNotFound":
      return `${label}は選べません。選び直してください`;
    case "FieldTooSmall":
      return `${label}は ${error.min} 以上にしてください`;
    case "FieldNotGreaterThan":
      return `${label}は「${than}」より大きくしてください`;
    default:
      return `${label}を確かめてください`;
  }
}

// 部屋の操作で、項目に結びつかない誤りの型から作る文言
const ROOM_ERROR_MESSAGES: Record<string, string> = {
  RevisionConflictError:
    "ほかの操作で部屋が変わっています。再読み込みしてから、もう一度操作してください",
  RoomNotFoundError: "この部屋は見つかりません",
  RoomStatusNotAllowedError:
    "今の部屋の状態ではできない操作です。再読み込みして状態を確かめてください",
  RoomSeatsNotDecidedError: "先に席の並びを決めてください",
  RoomConditionLockedError:
    "公開前に決めた条件は、準備中には変えられません。再読み込みしてください",
  RoomNotResponsibleError: "この操作は、担当の人だけができます",
  RoomAlreadyReadyError: "準備完了を申告したあとは、選び直せません",
  RoomConditionsNotDecidedError:
    "自分の担当の分に、まだ決まっていないものがあります",
  PlayerNotRegisteredError: PLAYER_NOT_REGISTERED,
};

export function roomErrorMessage(typename: string): string {
  return (
    ROOM_ERROR_MESSAGES[typename] ??
    "操作できませんでした。再読み込みしてからもう一度試してください"
  );
}

export const CORE_UNAVAILABLE_OPERATION =
  "core に接続できません。時間をおいてもう一度操作してください";
