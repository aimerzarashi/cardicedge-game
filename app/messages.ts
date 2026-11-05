// core は文言を返さず、理由の型と値だけを返すため、文言はここで作る

import type {
  CardType,
  MatchEndReason,
  MatchPhase,
  RoomStatus,
} from "@/graphql/graphql";

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
  handIndex: "手札の番号",
  to: "行き先",
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

// 段階を足し忘れると型検査で止まるよう、core の段階の型で持つ。今の番の人が何をする段階か
export const MATCH_PHASE_LABELS: Record<MatchPhase, string> = {
  DRAWING: "カードを引く",
  DISCARDING: "手札を捨てる",
  ROLLING: "サイコロを振る",
  CHOOSING_PATH: "行き先を選ぶ",
  ENDING: "ターンを終える",
  ENDED: "対戦は終わりました",
};

export const MATCH_END_REASON_LABELS: Record<MatchEndReason, string> = {
  TARGET_MAGIC: "目標の魔力に届いて拠点に戻った",
  ROUND_LIMIT: "ラウンドの上限に達した",
};

// ほかで進んだ・番や段階が違うときは、操作のあとに画面を読み直すので、今の状態を見てもらう
const MATCH_ERROR_MESSAGES: Record<string, string> = {
  RevisionConflictError:
    "ほかで対戦が進んだので、読み直しました。今の状態を確かめてください",
  MatchNotYourTurnError:
    "自分の番ではないので、読み直しました。今の状態を確かめてください",
  MatchPhaseNotAllowedError:
    "今の段階ではできない操作なので、読み直しました。今の状態を確かめてください",
  MatchNotFoundError: "この対戦は見つかりません",
  MatchRewardAlreadyReceivedError:
    "戦利品はもう受け取っています。読み直しました",
  PlayerNotRegisteredError: PLAYER_NOT_REGISTERED,
};

export function matchErrorMessage(typename: string): string {
  return (
    MATCH_ERROR_MESSAGES[typename] ??
    "操作できませんでした。再読み込みしてからもう一度試してください"
  );
}

// 描画したイベントの欄の 1 行。種類ごとの文言は、イベントが持つ値（core が返した事実）を並べるだけにする
export const MATCH_EVENT_MESSAGES = {
  created: "対戦が始まった",
  decksShuffled: "山札が混ざった",
  handsDealt: (cards: number) => `手札が ${cards} 枚ずつ配られた`,
  turnOrderDecided: (names: string) => `順番が決まった: ${names}`,
  cardDrawn: (card: string) => `カード「${card}」を引いた`,
  cardDiscarded: (card: string) => `カード「${card}」を捨てた`,
  diceRolled: (value: number) => `サイコロ ${value}`,
  moved: (x: number, y: number) => `(${x}, ${y}) へ進んだ`,
  checkpointPassed: (x: number, y: number, magic: number) =>
    `チェックポイント (${x}, ${y}) を通った（魔力 +${magic}）`,
  lapCompleted: (magic: number) => `周回を終えた（魔力 +${magic}）`,
  turnEnded: "ターンを終えた",
  ended: (winners: string, reason: string) =>
    `対戦が終わった（勝った人: ${winners}。${reason}）`,
  rewardDrawn: (cards: string) => `戦利品を引いた（${cards}）`,
  rewardsCompleted: "全員が戦利品を受け取った",
  unknown: "（知らない種類のイベント）",
  eventLine: (revision: number, actor: string | undefined, text: string) =>
    actor === undefined
      ? `版 ${revision} ${text}`
      : `版 ${revision} ${actor}: ${text}`,
};

// 対戦の振り返りと戦利品の欄の文言
export const MATCH_REVIEW_MESSAGES = {
  rank: (rank: number) => `${rank} 位`,
  rounds: (round: number) => `ラウンドの数: ${round}`,
  chooseRewardPack: (pack: string) => `${pack}を選ぶ`,
  rewardPending: "戦利品はまだ受け取っていません",
  rewardNone: "戦利品は配られません",
  rewardCards: (cards: string) => `戦利品: ${cards}`,
  backToRoom: "部屋に戻る",
};
