// core は文言を返さず、理由の型と値だけを返すため、文言はここで作る

import type {
  CardRarity,
  CardType,
  CreatureElement,
  ItemCategory,
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
  baseLandValue: "土地の基本の値",
} as const;
export type RuleField = keyof typeof RULE_LABELS;

// 魔力の 100 刻みは入力のしやすさのための表示の都合の値で、core の決まりではない（studio の ruleStep と同じ）。魔力でない項目は 1 刻み
export function ruleStep(field: RuleField): number {
  switch (field) {
    case "roundLimit":
    case "diceMin":
    case "diceMax":
    case "baseLandValue":
      return 1;
    default:
      return 100;
  }
}

// カードの種類の呼び方（studio の lib/card-type.ts と同じ）。Record<string, string> にしないのは、種類が core に加わったときに
// 足し忘れると、型検査に引っかからず種類の欄が黙って空になるため
// 種類は core の型（__typename）で見分ける。種類を足し忘れると型検査で止まるよう、型の名前で持つ
export const CARD_TYPE_LABELS: Record<
  "CreatureCardInfo" | "ItemCardInfo" | "SpellCardInfo",
  string
> = {
  CreatureCardInfo: "クリーチャー",
  ItemCardInfo: "アイテム",
  SpellCardInfo: "スペル",
};

// 種類の足し忘れを型検査で見つけるため、Record<ItemCategory, …> で持つ（CARD_TYPE_LABELS と同じ）
export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  WEAPON: "武器",
  ARMOR: "防具",
  SCROLL: "巻物",
};

// 符号つきで出す（下げるアイテムと見分けるため）。増減の無い項目は出さない
export function itemBonusesLabel(
  attackBonus: number,
  hitPointsBonus: number,
): string {
  const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);
  const parts = [
    ...(attackBonus !== 0 ? [`AT ${signed(attackBonus)}`] : []),
    ...(hitPointsBonus !== 0 ? [`HP ${signed(hitPointsBonus)}`] : []),
  ];
  return parts.length > 0 ? parts.join("・") : "増減なし";
}

// 所持カードの絞り込みの選択肢（core の CardType。結果の種類は __typename で見分けるので CARD_TYPE_LABELS とは別）
export const CARD_TYPE_FILTERS: { value: CardType; label: string }[] = [
  { value: "CREATURE", label: "クリーチャー" },
  { value: "ITEM", label: "アイテム" },
  { value: "SPELL", label: "スペル" },
];

export function isCardType(value: string): value is CardType {
  return CARD_TYPE_FILTERS.some((type) => type.value === value);
}

// 希少度は画面では略称で出す（core の値は略さない名前）
export const RARITY_LABELS: Record<CardRarity, string> = {
  NORMAL: "N",
  STRANGE: "S",
  RARE: "R",
  EXTRA: "E",
};

// クリーチャーの属性（core の CreatureElement。ボードのマスの属性 BoardTileElement とは別の型のため、ボードの ELEMENT_LABELS と分ける）
export const CREATURE_ELEMENT_LABELS: Record<CreatureElement, string> = {
  FIRE: "火",
  EARTH: "地",
  WATER: "水",
  WIND: "風",
  NEUTRAL: "無",
};

// 複数の属性は core が並べた順のまま 1 文字ずつつなぐ（例: 火水）
export function elementsLabel(elements: readonly CreatureElement[]): string {
  return elements.map((element) => CREATURE_ELEMENT_LABELS[element]).join("");
}

// 状態を足し忘れると型検査で止まるよう、core の状態の型で持つ（CARD_TYPE_LABELS と同じ）
export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  DRAFT: "公開前",
  PREPARING: "準備中",
  PLAYING: "対戦中",
  DECIDING_NEXT: "次を決める",
  PAUSED: "休止中",
  CLOSED: "閉じた",
};

// 部屋を作る前に済ませること（core の roomRequirements。足りないものだけが来る）と、その画面
export const ROOM_REQUIREMENT_STEPS = {
  AVATAR: { label: "アバターを作る", href: "/avatars" },
  DECK: {
    label: "デッキを受け取る（スターターの受け取りが済むと届きます）",
    href: "/decks",
  },
} as const;

// 次を決める間の、参加者ごとの意思表示（core の continues。まだなら null）
export function continuesLabel(continues: boolean | null | undefined): string {
  if (continues === null || continues === undefined) {
    return "まだ";
  }
  return continues ? "続ける" : "終える";
}

// 何戦目か（core の number は 1 始まり。投影の遅れの間は null）
export function matchNumberLabel(number: number): string {
  return `${number} 戦目`;
}

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
  itemHandIndex: "アイテム",
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
  RoomAlreadyDeclaredNextError: "続けるか終えるかは、もう選んでいます",
  RoomRequirementsNotMetError:
    "部屋を作るには、先にアバターとデッキが要ります。再読み込みしてください",
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

// 操作は済んだが、詳細（投影）が操作の結果まで追いつくのを待ちきれなかった（投影が止まっている等）
export const NOT_REFLECTED =
  "反映に時間がかかっています。しばらくしてから再読み込みしてください";

export const CORE_UNAVAILABLE_OPERATION =
  "core に接続できません。時間をおいてもう一度操作してください";

// 段階を足し忘れると型検査で止まるよう、core の段階の型で持つ。今の番の人が何をする段階か
// 再生の途中で、操作を待っていない間の段階の表示
export const MATCH_PHASE_NOT_WAITING = "進行中";

export const MATCH_PHASE_LABELS: Record<MatchPhase, string> = {
  DRAWING: "カードを引く",
  DISCARDING: "手札を捨てる",
  ROLLING: "サイコロを振る",
  CHOOSING_PATH: "行き先を選ぶ",
  DEPLOYING: "クリーチャーを配置する",
  INVADING: "通行料を払うか侵略する",
  ATTACKING: "攻める側がアイテムを選ぶ",
  DEFENDING: "守る側がアイテムを選ぶ",
  RELINQUISHING: "領地を手放す",
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
  creatureDeployed: (card: string, x: number, y: number, cost: number) =>
    `クリーチャー「${card}」を (${x}, ${y}) に配置した（魔力 -${cost}）`,
  territoryInvaded: (card: string, x: number, y: number, cost: number) =>
    `クリーチャー「${card}」で (${x}, ${y}) を侵略した（魔力 -${cost}）`,
  itemUsed: (card: string, cost: number) =>
    `アイテム「${card}」を出した（魔力 -${cost}）`,
  itemSkipped: "アイテムを出さなかった",
  creatureStruck: (striker: string, damage: number, remaining: number) =>
    `${striker}の攻撃 ${damage}（残りの HP ${remaining}）`,
  battleAttacker: "攻める側",
  battleDefender: "守る側",
  territoryConquered: (x: number, y: number) => `(${x}, ${y}) を奪った`,
  invasionRepelled: (card: string, returnedToHand: boolean) =>
    `侵略に失敗した（「${card}」は${returnedToHand ? "手札に戻った" : "捨て札になった"}）`,
  tollPaid: (owner: string, x: number, y: number, magic: number) =>
    `${owner}の領地 (${x}, ${y}) に通行料を払った（魔力 -${magic}）`,
  territoryRelinquished: (x: number, y: number, magic: number) =>
    `領地 (${x}, ${y}) を手放した（魔力 +${magic}）`,
  magicDepleted: (magic: number) =>
    `魔力が枯渇し、拠点からやり直す（魔力 ${magic}）`,
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
