// core は文言を返さず、理由の型と値だけを返すため、文言はここで作る

import type {
  BoardTileElement,
  CardRarity,
  CardType,
  CreatureElement,
  EffectDestruction,
  EffectKind,
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

// アイテム制限の表示（core が並べた順。無ければ「なし」）
export function itemRestrictionsLabel(
  itemRestrictions: readonly ItemCategory[],
): string {
  return itemRestrictions.length === 0
    ? "なし"
    : itemRestrictions
        .map((category) => ITEM_CATEGORY_LABELS[category])
        .join("・");
}

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

// 符号つきで出す（下げるアイテムと見分けるため）。増減の無い項目は出さない
export function itemModifiersLabel(
  attackModifier: number,
  hitPointsModifier: number,
): string {
  const parts = [
    ...(attackModifier !== 0 ? [`AT ${signed(attackModifier)}`] : []),
    ...(hitPointsModifier !== 0 ? [`HP ${signed(hitPointsModifier)}`] : []),
  ];
  return parts.length > 0 ? parts.join("・") : "増減なし";
}

// 効果の画面のラベル。アイテムとクリーチャーで共有する（core の型も共有している。core#178）。「強打」「先制」「後手」「攻撃無効」は効果の
// 画面のラベル（2026-11-14・2026-11-15 オーナー）。Record<EffectKind, …> にするのは、core に効果が足されたときの足し忘れを型検査で見つけるため
export const EFFECT_LABELS: Record<EffectKind, string> = {
  ATTACK_MODIFIER: "AT の増減",
  HIT_POINTS_MODIFIER: "HP の増減",
  ATTACK_OVERRIDE: "AT の上書き",
  HIT_POINTS_OVERRIDE: "HP の上書き",
  ATTACK_MULTIPLIER: "強打",
  IGNORE_TERRAIN_EFFECT: "地形効果を無視する",
  STRIKE_FIRST: "先制",
  STRIKE_LAST: "後手",
  NULLIFY_RECEIVED_DAMAGE: "攻撃無効",
  TOLL_MULTIPLIER: "通行料の倍率",
  FORBID_INVASION: "侵略できない",
  FORBID_MOVEMENT: "移動できない",
  RETURN_TO_HAND_ON_DESTRUCTION: "破壊されたら手札に戻る",
  GAIN_MAGIC_ON_DESTRUCTION: "破壊されたら魔力を得る",
};

// 破壊されたときの効果が発動する破壊（core の 3 つの破壊のイベントと対応する。core#182）
export const DESTRUCTION_LABELS: Record<EffectDestruction, string> = {
  INVADING: "侵略したとき",
  DEFENDING: "守るとき",
  BOARD: "ボード",
};

// core が返した効果 1 つ（値の要る効果だけが値を持つ。制約は今は相手のクリーチャーの属性だけ）
export type EffectView = {
  kind: EffectKind;
  value?: number;
  minimum?: number;
  maximum?: number;
  percent?: number;
  opponentElements?: CreatureElement[];
  destructions?: EffectDestruction[];
  amount?: number;
};

// core の効果の型（種類は __typename）から、表示の形にする
export function effectView(effect: {
  kind: EffectKind;
  value?: number;
  minimum?: number;
  maximum?: number;
  percent?: number;
  constraints?: readonly { elements?: CreatureElement[] }[];
  destructions?: readonly EffectDestruction[];
  amount?: number;
}): EffectView {
  return {
    kind: effect.kind,
    value: effect.value,
    minimum: effect.minimum,
    maximum: effect.maximum,
    percent: effect.percent,
    opponentElements: effect.constraints?.flatMap(
      ({ elements }) => elements ?? [],
    ),
    destructions: effect.destructions ? [...effect.destructions] : undefined,
    amount: effect.amount,
  };
}

function destructionsLabel(effect: EffectView): string {
  return (effect.destructions ?? [])
    .map((destruction) => DESTRUCTION_LABELS[destruction])
    .join("・");
}

// 上書きの範囲（固定は「30」、範囲は「10〜70」）
export function overrideRangeLabel(minimum: number, maximum: number): string {
  return minimum === maximum ? `${minimum}` : `${minimum}〜${maximum}`;
}

function withOpponent(label: string, effect: EffectView): string {
  const elements = effect.opponentElements ?? [];
  return elements.length === 0
    ? label
    : `${label}（相手が${elementsLabel(elements)}）`;
}

// 効果 1 つの表示（例: AT +25、AT を 30 に上書き、HP を 10〜70 に上書き、強打 150%（相手が水）、先制、攻撃無効（相手が火地））
export function effectLabel(effect: EffectView): string {
  switch (effect.kind) {
    case "ATTACK_MODIFIER":
      return `AT ${signed(effect.value ?? 0)}`;
    case "HIT_POINTS_MODIFIER":
      return `HP ${signed(effect.value ?? 0)}`;
    case "ATTACK_OVERRIDE":
      return `AT を ${overrideRangeLabel(effect.minimum ?? 0, effect.maximum ?? 0)} に上書き`;
    case "HIT_POINTS_OVERRIDE":
      return `HP を ${overrideRangeLabel(effect.minimum ?? 0, effect.maximum ?? 0)} に上書き`;
    case "ATTACK_MULTIPLIER":
      return withOpponent(`強打 ${effect.percent ?? 0}%`, effect);
    case "NULLIFY_RECEIVED_DAMAGE":
      return withOpponent("攻撃無効", effect);
    case "TOLL_MULTIPLIER":
      return `通行料の倍率 ${effect.percent ?? 0}%`;
    case "RETURN_TO_HAND_ON_DESTRUCTION":
      return `破壊されたら手札に戻る（${destructionsLabel(effect)}）`;
    case "GAIN_MAGIC_ON_DESTRUCTION":
      return `破壊されたら魔力 +${effect.amount ?? 0}（${destructionsLabel(effect)}）`;
    default:
      return EFFECT_LABELS[effect.kind];
  }
}

// 効果の表示（core が返した並びのまま。無ければ「効果なし」）
export function effectsLabel(effects: readonly EffectView[]): string {
  return effects.length === 0
    ? "効果なし"
    : effects.map(effectLabel).join("・");
}

// 戦闘の増減の行の、決まった増減（modifier）と実際の増減（delta）。下限の 0 で止まって違うときだけ実際の量を添える
// （例「HP -99（-30 で止まった）」。core#166 で出どころが決まった増減を持つので、イベントだけで説明できる）
export function battleModifierChangeLabel(
  attackModifier: number,
  hitPointsModifier: number,
  attackDelta: number,
  hitPointsDelta: number,
): string {
  const part = (stat: string, modifier: number, delta: number) => {
    if (modifier === delta) return `${stat} ${signed(modifier)}`;
    if (delta === 0) return `${stat} ${signed(modifier)}（変わらず）`;
    return `${stat} ${signed(modifier)}（${signed(delta)} で止まった）`;
  };
  const parts = [
    ...(attackModifier !== 0 || attackDelta !== 0
      ? [part("AT", attackModifier, attackDelta)]
      : []),
    ...(hitPointsModifier !== 0 || hitPointsDelta !== 0
      ? [part("HP", hitPointsModifier, hitPointsDelta)]
      : []),
  ];
  return parts.length > 0 ? parts.join("・") : "増減なし";
}

// core が返したスペルの効果（種類は __typename。効果なしは null）
export type SpellEffectView =
  | {
      __typename?: string;
      count?: number;
      perLap?: number;
      value?: number;
      turns?: number;
      amount?: number;
    }
  | null
  | undefined;

// スペルの効果の表示。種類は core が返した __typename で見分け、効果なし（null）は「なし」（studio の messages.ts と同じ）
export function spellEffectLabel(effect: SpellEffectView): string {
  switch (effect?.__typename) {
    case "DrawCardsSpellEffect":
      return `カードを ${effect.count} 枚引く`;
    case "GainMagicSpellEffect":
      return `（周回数 + 1）× ${effect.perLap} の魔力を得る`;
    case "MultipleDiceSpellEffect":
      return `対象のサイコロを ${effect.count} 個同時に振る（${effect.turns} ターン）`;
    case "FixedDiceSpellEffect":
      return `対象のサイコロの目を ${effect.value} に固定する（${effect.turns} ターン）`;
    case "DamageSpellEffect":
      return `対象のクリーチャーに ${effect.amount} ダメージ`;
    default:
      return "なし";
  }
}

// ターンをまたいで効き続けるスペルの効果の名前と、効き方の値（再生の行・参加者の欄で使う）
function lastingSpellEffectParts(
  effect: SpellEffectView,
): { name: string; detail: string } | null {
  switch (effect?.__typename) {
    case "MultipleDiceSpellEffect":
      return { name: "サイコロを複数振る", detail: `${effect.count} 個` };
    case "FixedDiceSpellEffect":
      return { name: "サイコロの目を固定する", detail: `目 ${effect.value}` };
    default:
      return null;
  }
}

// 参加者に続いているスペルの効果の表示（無ければ「なし」）
export function lastingSpellEffectLabel(
  lasting: { effect: SpellEffectView; remainingTurns: number } | null,
): string {
  const parts = lasting && lastingSpellEffectParts(lasting.effect);
  return parts
    ? `${parts.name}（${parts.detail}・残り ${lasting.remainingTurns} ターン）`
    : "なし";
}

// スペルを使い、対象にターンをまたいで効き続ける効果がかかった行（使ったときに発動する。2026-11-13 オーナー）
export function spellEffectStartedLabel(
  target: string,
  effect: SpellEffectView,
  turns: number,
): string {
  const parts = lastingSpellEffectParts(effect);
  return parts
    ? `${target}にスペル「${parts.name}」が発動（${parts.detail}・${turns} ターン）`
    : `${target}にスペルが発動（${turns} ターン）`;
}

// 振った目（複数のサイコロを同時に振ったときは 1 個ずつの目と合計）。続いていたスペルの効果で振ったときは、その効果を添える
export function diceRolledLabel(
  value: number,
  dice: number[],
  effect: SpellEffectView,
): string {
  const rolled =
    dice.length > 1
      ? `サイコロ ${dice.join(" + ")} = ${value}`
      : `サイコロ ${value}`;
  const parts = lastingSpellEffectParts(effect);
  return parts ? `${rolled}（スペル「${parts.name}」の効果）` : rolled;
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

// 配置制限の値は土地の属性（クリーチャーの属性ではない。core#178）。表示は 1 文字ずつつなぐ（無ければ「なし」）
const LAND_ELEMENT_LABELS: Record<BoardTileElement, string> = {
  FIRE: "火",
  EARTH: "地",
  WATER: "水",
  WIND: "風",
  NEUTRAL: "無",
  MULTI: "複",
};

export function placementRestrictionsLabel(
  elements: readonly BoardTileElement[],
): string {
  return elements.length === 0
    ? "なし"
    : elements.map((element) => LAND_ELEMENT_LABELS[element]).join("");
}

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
  DISCARDING: "手札を上限まで捨てる",
  ROLLING: "サイコロを振る",
  CHOOSING_PATH: "行き先を選ぶ",
  PLACING: "クリーチャーを配置する",
  INVADING: "通行料を払うか侵略する",
  ATTACKING: "攻める側がアイテムを選ぶ",
  DEFENDING: "守る側がアイテムを選ぶ",
  TERRITORY_COMMANDING: "領地コマンド",
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
function battleStatChange(change: string, attack: number, hitPoints: number) {
  return `${change} → AT ${attack}・HP ${hitPoints}${hitPoints === 0 ? "（破壊された）" : ""}`;
}

// 戦闘の描画（デバッグの画面。game#98）
export const BATTLE_SCENE_LABELS = {
  attackerItem: "攻める側のアイテム選択",
  defenderItem: "守る側のアイテム選択",
  firstStrike: "先攻",
  secondStrike: "後攻",
  result: "結果",
} as const;

export const BATTLE_VIEW_MESSAGES = {
  title: "戦闘",
  attacker: "攻める側",
  defender: "守る側",
  item: "アイテム",
  noItem: "出さなかった",
  noItemShort: "アイテムなし",
  notChosen: "まだ選んでいない",
  initial: "戦闘の前",
  modifiers: "効果ごとの増減",
  noModifiers: "なし",
  states: "得た状態",
  damages: "受けたダメージ",
  current: "今",
  stats: (attack: number, hitPoints: number) => `AT ${attack}・HP ${hitPoints}`,
  supportSource: "支援効果",
  terrainSource: "地形効果",
  // 増減の効果は名前だけ、ほかの効果（上書き・強打）は効果の名前も添える
  itemSource: (name: string, effect: EffectKind) =>
    effect === "ATTACK_MODIFIER" || effect === "HIT_POINTS_MODIFIER"
      ? `アイテム「${name}」`
      : `アイテム「${name}」の${EFFECT_LABELS[effect]}`,
  ignoredSuffix: "（無視された）",
  // クリーチャーの効果（戦闘の欄はクリーチャーの側の中なので、名前は添えず効果だけ）
  creatureSource: (effect: EffectKind) => `効果「${EFFECT_LABELS[effect]}」`,
  firstMark: "（先攻）",
  conquered: "攻める側が奪った",
  repelled: "侵略に失敗した",
} as const;

export const MATCH_EVENT_MESSAGES = {
  created: "対戦が始まった",
  drawPilesShuffled: "山札が混ざった",
  handsDealt: (cards: number) => `手札が ${cards} 枚ずつ配られた`,
  turnOrderDecided: (names: string) => `順番が決まった: ${names}`,
  cardDrawn: (card: string) => `カード「${card}」を引いた`,
  cardDiscarded: (card: string) => `カード「${card}」を捨てた`,
  discardPileShuffled: (cards: number) =>
    `捨て札 ${cards} 枚を混ぜて山札にした`,
  handLimitExceeded: (handCount: number, maxHandCards: number) =>
    `手札が上限を超えたので、ターンを終える前に ${handCount - maxHandCards} 枚捨てる（手札 ${handCount} 枚・上限 ${maxHandCards} 枚）`,
  spellEffectEnded: "続いていたスペルの効果が終わった",
  creatureDamaged: (x: number, y: number, damage: number, remaining: number) =>
    `(${x}, ${y}) のクリーチャーに ${damage} ダメージ（残りの HP ${remaining}）`,
  // 破壊の行はイベントの名前と同じ言葉で始め、捨て札・空き地になることは書かない（どの破壊でも同じ決まりのため。core#181）
  boardCreatureDestroyed: (x: number, y: number, card: string) =>
    `(${x}, ${y}) のクリーチャー「${card}」が破壊された`,
  invadingCreatureDestroyed: (card: string) =>
    `侵略したクリーチャー「${card}」が破壊された`,
  defendingCreatureDestroyed: (card: string) =>
    `守るクリーチャー「${card}」が破壊された`,
  magicGained: (magic: number, laps: number, magicPerLap: number) =>
    `魔力を得た（魔力 +${magic}。（周回 ${laps} 回 + 1）× ${magicPerLap}）`,
  pieceMoved: (x: number, y: number) => `(${x}, ${y}) へ進んだ`,
  checkpointPassed: (x: number, y: number, magic: number) =>
    `チェックポイント (${x}, ${y}) を通った（魔力 +${magic}）`,
  lapCompleted: (magic: number) => `周回を終えた（魔力 +${magic}）`,
  creaturePlaced: (card: string, x: number, y: number, cost: number) =>
    `クリーチャー「${card}」を (${x}, ${y}) に配置した（魔力 -${cost}）`,
  territoryInvaded: (
    card: string,
    defender: string,
    x: number,
    y: number,
    cost: number,
  ) =>
    `クリーチャー「${card}」でクリーチャー「${defender}」が守る領地 (${x}, ${y}) を侵略した（魔力 -${cost}）`,
  spellUsed: (card: string, cost: number) =>
    `スペル「${card}」を使った（魔力 -${cost}）`,
  itemUsed: (card: string, cost: number) =>
    `アイテム「${card}」を出した（魔力 -${cost}）`,
  itemSkipped: "アイテムを出さなかった",
  // 効果の発動は、戦闘・盤面とも「〈どこに〉〈持ち主の〉効果「〈名前〉」が発動（〈具体的な効果〉）」にそろえる（2026-11-12 オーナー。game#87。
  // core#177 でアイテム、core#178 でクリーチャーも効果に）。target は助詞まで含め（側は「守る側に」、位置は「(1, 0) に」と、座標の後だけ空白が
  // 要るため）、owner は「の」まで含める（「クリーチャー「ノーム」の」。持ち主が引けないときは空）
  effectActivated: (
    target: string,
    owner: string,
    effect: string,
    detail?: string,
  ) =>
    `${target}${owner}効果「${effect}」が発動${detail ? `（${detail}）` : ""}`,
  creatureOwner: (card: string) => `クリーチャー「${card}」の`,
  itemOwner: (card: string) => `アイテム「${card}」の`,
  // 上書き: 範囲（固定は値）と、AT・HP をその値に変えた差
  overrideEffect: (
    stat: string,
    range: string,
    change: string,
    attack: number,
    hitPoints: number,
  ) => `${stat} を ${range} に: ${battleStatChange(change, attack, hitPoints)}`,
  sideTarget: (side: string) => `${side}に`,
  // 破壊されたときの効果は、破壊されて盤面にいないので持ち主に（core#182）
  ownerTarget: (owner: string) => `${owner}に`,
  cardReturnedToHand: (card: string, owner: string) =>
    `「${card}」が${owner}の手札に戻った`,
  magicReceived: (owner: string, magic: number) =>
    `${owner}が魔力 ${magic} を受け取った`,
  positionTarget: (x: number, y: number) => `(${x}, ${y}) に`,
  // 攻撃の値と受けた量を分けて書く（攻撃無効で受けた量が 0 のときも「攻撃したけれど 0」と読めるように。2026-11-13 オーナー。game#97）
  creatureStruck: (
    striker: string,
    attack: number,
    receiver: string,
    damage: number,
    remaining: number,
  ) =>
    `${striker}の攻撃 ${attack} → ${receiver}のダメージ ${damage}（残りの HP ${remaining}）`,
  battleStarted: (
    attackerAttack: number,
    attackerHitPoints: number,
    defenderAttack: number,
    defenderHitPoints: number,
  ) =>
    `戦闘が始まった（攻める側 AT ${attackerAttack}・HP ${attackerHitPoints}、守る側 AT ${defenderAttack}・HP ${defenderHitPoints}）`,
  battleStatModified: (
    side: string,
    source: string,
    change: string,
    attack: number,
    hitPoints: number,
  ) => `${side}に${source}: ${battleStatChange(change, attack, hitPoints)}`,
  battleStatChange,
  adjacentTerritoriesSource: (count: number, bonusPerTerritory: number) =>
    `支援効果（隣の領地 ${count} つ × AT +${bonusPerTerritory}）`,
  terrainSource: (element: string, level: number, bonusPerLevel: number) =>
    `地形効果（${element}属性 レベル ${level} × HP +${bonusPerLevel}）`,
  itemSource: (card: string) => `アイテム「${card}」`,
  attackMultiplierEffect: (
    percent: number,
    change: string,
    attack: number,
    hitPoints: number,
  ) => `${percent}%: ${battleStatChange(change, attack, hitPoints)}`,
  // 相手の HP が地形効果の分を除いた値になる（地形効果は発動したまま、この攻撃では無視される）
  ignoreTerrainEffect: (
    opponent: string,
    change: string,
    attack: number,
    hitPoints: number,
  ) =>
    `${opponent}の地形効果の分を除く: ${battleStatChange(change, attack, hitPoints)}`,
  battleAttacker: "攻める側",
  battleDefender: "守る側",
  invasionSucceeded: (x: number, y: number) =>
    `侵略に成功した（(${x}, ${y}) を奪った）`,
  // 倒れたときは、直前の破壊の行に出るので「侵略に失敗した」だけ
  invasionFailed: "侵略に失敗した",
  invasionFailedReturned: (card: string, to: "hand" | "origin") =>
    `侵略に失敗した（「${card}」は${to === "hand" ? "手札に戻った" : "元の領地に戻った"}）`,
  creatureMoved: (fromX: number, fromY: number, toX: number, toY: number) =>
    `(${fromX}, ${fromY}) のクリーチャーを (${toX}, ${toY}) へ動かした`,
  territoryInvadedByMove: (
    card: string,
    fromX: number,
    fromY: number,
    defender: string,
    x: number,
    y: number,
  ) =>
    `クリーチャー「${card}」が (${fromX}, ${fromY}) からクリーチャー「${defender}」が守る領地 (${x}, ${y}) を侵略した`,
  tollMultiplierEffect: (
    percent: number,
    toll: number,
    multipliedToll: number,
  ) => `${percent}%: 通行料 ${toll} → ${multipliedToll}`,
  tollPaid: (owner: string, x: number, y: number, magic: number) =>
    `${owner}の領地 (${x}, ${y}) に通行料を払った（魔力 -${magic}）`,
  landLeveledUp: (x: number, y: number, level: number, magic: number) =>
    `領地 (${x}, ${y}) をレベル ${level} に上げた（魔力 -${magic}）`,
  landElementChanged: (
    x: number,
    y: number,
    element: string,
    magic: number,
    baseLandValue: number,
    multiplier: number,
  ) =>
    `領地 (${x}, ${y}) の土地を${element}属性に変えた（魔力 -${magic}。基本の値 ${baseLandValue} × ${multiplier}）`,
  creatureExchanged: (
    x: number,
    y: number,
    card: string,
    returned: string,
    cost: number,
  ) =>
    `領地 (${x}, ${y}) の「${returned}」を「${card}」に交換した（魔力 -${cost}）`,
  territoryRelinquished: (x: number, y: number, magic: number) =>
    `領地 (${x}, ${y}) を手放した（魔力 +${magic}）`,
  magicDepleted: (magic: number) =>
    `魔力が枯渇し、拠点からやり直す（魔力 ${magic}）`,
  turnEnded: "ターンを終えた",
  ended: (winners: string, reason: string) =>
    `対戦が終わった（勝った人: ${winners}。${reason}）`,
  rewardDrawn: (cards: string) => `戦利品を引いた（${cards}）`,
  allRewardsReceived: "全員が戦利品を受け取った",
  unknown: "（知らない種類のイベント）",
  eventLine: (revision: number, actor: string | undefined, text: string) =>
    actor === undefined
      ? `版 ${revision} ${text}`
      : `版 ${revision} ${actor}: ${text}`,
  // 同じ連鎖に入る領地は同じ「前 → 後」で動くので、それごとにまとめる（2026-11-12 オーナー）
  chainChanged: (groups: string[]) => `（${groups.join("。")}）`,
  chainChange: (from: number, to: number, positions: string[]) =>
    `連鎖 ${from} → ${to}: ${positions.join("・")}`,
  chainPosition: (x: number, y: number) => `(${x}, ${y})`,
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
