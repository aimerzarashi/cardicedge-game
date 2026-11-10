/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
/** 侵略を確定した人がアイテムを選ぶ入力 */
export type AttackMatchTerritoryInput = {
  /** 対戦の公開用の ID */
  id: string;
  /** 出すアイテムの手札の番号（0 始まり。Match.itemChoices の中から選ぶ。出さなければ null。選べないものは ValidationErrors の FieldNotFound） */
  itemHandIndex?: number | null | undefined;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** 格子の座標の入力。BoardPosition と同じ */
export type BoardPositionInput = {
  /** 列（0 始まり） */
  x: number;
  /** 行（0 始まり） */
  y: number;
};

/**
 * 土地の属性。土地は必ずどれか 1 つを持つ（火属性の土地・地属性の土地 等）。拠点・チェックポイントは持たない。
 * 効き方（地形効果・連鎖・属性の変更のコスト等）は対戦の決まりで、ここでは決めない
 */
export type BoardTileElement =
  /** 地（地属性） */
  | 'EARTH'
  /** 火（火属性） */
  | 'FIRE'
  /** 複（複属性）。火・地・水・風の 4 色のマークが描かれた特殊な土地。組み合わせは持たない（属性の値の 1 つ） */
  | 'MULTI'
  /** 無（無属性） */
  | 'NEUTRAL'
  /** 水（水属性） */
  | 'WATER'
  /** 風（風属性） */
  | 'WIND';

/** カードの希少度 */
export type CardRarity =
  /** 画面では E */
  | 'EXTRA'
  /** 画面では N */
  | 'NORMAL'
  /** 画面では R */
  | 'RARE'
  /** 画面では S */
  | 'STRANGE';

/** カードの種類。所持カードの絞り込みに使う（結果のカードの種類は __typename で見分ける） */
export type CardType =
  /** クリーチャー */
  | 'CREATURE'
  /** アイテム */
  | 'ITEM'
  /** スペル */
  | 'SPELL';

/** 通った自分の領地の土地の属性を変える入力 */
export type ChangeMatchLandElementInput = {
  /** 変えた後の属性 */
  element: BoardTileElement;
  /** 対戦の公開用の ID */
  id: string;
  /** 領地の位置（Match.elementChangeChoices の中から選ぶ。選べない組は ValidationErrors の FieldNotFound） */
  position: BoardPositionInput;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** 対戦ルールを決める入力。8 つの値の名前と決まりは、ボードの既定のルールと同じ */
export type ChangeRoomMatchRulesInput = {
  /** 土地の基本の値（1 以上。レベルと連鎖の倍率を掛ける元） */
  baseLandValue: number;
  /** ボードの公開用の ID（作った人が解放した公開中のもの。Player.boards に出るもの） */
  boardId: string;
  /** チェックポイントのボーナス（0 以上） */
  checkpointBonus: number;
  /** サイコロの目の最大（最小以上） */
  diceMax: number;
  /** サイコロの目の最小（1 以上） */
  diceMin: number;
  /** 部屋の公開用の ID */
  id: string;
  /** 周回のボーナス（0 以上） */
  lapBonus: number;
  /** 画面が見ていた部屋の revision */
  revision: number;
  /** ラウンドの上限（1 以上） */
  roundLimit: number;
  /** 開始時の魔力（0 以上） */
  startingMagic: number;
  /** 目標の魔力（1 以上、開始時の魔力より大きい） */
  targetMagic: number;
};

/** 席のアバターとデッキを選ぶ入力。席の種類で、選ぶものが変わる */
export type ChangeRoomSeatChoiceInput = {
  /** アバターの公開用の ID（プレイヤーの席は座っている人のアバター（Player.avatars に出るもの）、NPC の席は作った人が解放した公開中の NPC のアバター（Player.npcAvatars に出るもの）） */
  avatarId: string;
  /** デッキの公開用の ID（プレイヤーの席は座っている人のデッキ（Player.decks に出るもの）、NPC の席は選んだ NPC のアバターに割り当てた公開中のデッキ（Player.npcAvatars の decks に出るもの）） */
  deckId: string;
  /** 部屋の公開用の ID */
  id: string;
  /** 画面が見ていた部屋の revision */
  revision: number;
  /** 席の番号（席の並びの何番目か。0 始まり） */
  seat: number;
};

/** 席の並びを決める入力 */
export type ChangeRoomSeatsInput = {
  /** 部屋の公開用の ID */
  id: string;
  /** 画面が見ていた部屋の revision */
  revision: number;
  /** 席の並び（席の数は全体のルールの人数の範囲 FieldOutOfRange の min・max、プレイヤーの席は 1 つ FieldCountMismatch の expected）。並びを変えたら、席の選択はすべて外れる */
  seats: Array<RoomSeatKind>;
};

/** 分かれ道で行き先を選ぶ入力 */
export type ChooseMatchPathInput = {
  /** 対戦の公開用の ID */
  id: string;
  /** 画面が見ていた対戦の revision */
  revision: number;
  /** 行き先の位置（Match.pathChoices の中から選ぶ。選べないものは ValidationErrors の FieldNotFound） */
  to: BoardPositionInput;
};

/** 戦利品のパックを選ぶ入力 */
export type ChooseMatchRewardPackInput = {
  /** 対戦の公開用の ID */
  id: string;
  /** 選ぶパックのキー（Match.rewardPacks の中から選ぶ。選べないものは ValidationErrors の FieldNotFound） */
  pack: string;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** 部屋を閉じる入力 */
export type CloseRoomInput = {
  /** 部屋の公開用の ID */
  id: string;
  /** 画面が見ていた部屋の revision */
  revision: number;
};

/** 所持カードの絞り込み */
export type CollectionFilter = {
  /** カードの種類（指定が無ければすべて。空のリストは入力の誤り） */
  types?: Array<CardType> | null | undefined;
};

/** 部屋を作る入力 */
export type CreateRoomInput = {
  /** 部屋の名前（前後の空白を除いて 1〜20 文字。FieldRequired・FieldTooLong の max。ほかの部屋と同じでもよい） */
  name: string;
};

/** クリーチャーの属性。火・地・水・風のうち 1〜4 つか、無の単独 */
export type CreatureElement =
  /** 地 */
  | 'EARTH'
  /** 火 */
  | 'FIRE'
  /** 無 */
  | 'NEUTRAL'
  /** 水 */
  | 'WATER'
  /** 風 */
  | 'WIND';

/** 対戦の後の意思表示の入力 */
export type DeclareRoomNextInput = {
  /** 続けるなら true、終えるなら false */
  continue: boolean;
  /** 部屋の公開用の ID */
  id: string;
  /** 画面が見ていた部屋の revision */
  revision: number;
};

/** 準備完了を申告する入力 */
export type DeclareRoomReadyInput = {
  /** 部屋の公開用の ID */
  id: string;
  /** 画面が見ていた部屋の revision */
  revision: number;
};

/** 侵略された領地を守る入力 */
export type DefendMatchTerritoryInput = {
  /** 対戦の公開用の ID */
  id: string;
  /** 出すアイテムの手札の番号（0 始まり。Match.itemChoices の中から選ぶ。出さなければ null。選べないものは ValidationErrors の FieldNotFound） */
  itemHandIndex?: number | null | undefined;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** 止まった空き地にクリーチャーを配置する入力 */
export type DeployMatchCreatureInput = {
  /** 配置する手札の番号（0 始まり。Match.deployChoices の中から選ぶ。手札の範囲の外は ValidationErrors の FieldOutOfRange、範囲の中で配置できないものは FieldNotFound） */
  handIndex: number;
  /** 対戦の公開用の ID */
  id: string;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** 手札を 1 枚捨てる入力 */
export type DiscardMatchCardInput = {
  /** 捨てる手札の番号（0 始まり。自分の手札の枚数の範囲。範囲の外は ValidationErrors の FieldOutOfRange） */
  handIndex: number;
  /** 対戦の公開用の ID */
  id: string;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** カードを引く入力 */
export type DrawMatchCardInput = {
  /** 対戦の公開用の ID */
  id: string;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** ターンを終える入力 */
export type EndMatchTurnInput = {
  /** 対戦の公開用の ID */
  id: string;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** 通った自分の領地のクリーチャーを手札のクリーチャーと交換する入力 */
export type ExchangeMatchCreatureInput = {
  /** 出す手札の番号（0 始まり） */
  handIndex: number;
  /** 対戦の公開用の ID */
  id: string;
  /** 領地の位置（Match.exchangeChoices の中から選ぶ。選べない組は ValidationErrors の FieldNotFound） */
  position: BoardPositionInput;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** 止まった他人の領地を侵略する入力 */
export type InvadeMatchTerritoryInput = {
  /** 侵略に出す手札の番号（0 始まり。Match.invadeChoices の中から選ぶ。手札の範囲の外は ValidationErrors の FieldOutOfRange、範囲の中で出せないものは FieldNotFound） */
  handIndex: number;
  /** 対戦の公開用の ID */
  id: string;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** アイテムの分類 */
export type ItemCategory =
  /** 防具 */
  | 'ARMOR'
  /** 巻物 */
  | 'SCROLL'
  /** 武器 */
  | 'WEAPON';

/** 通った自分の領地のレベルを上げる入力 */
export type LevelUpMatchTerritoryInput = {
  /** 対戦の公開用の ID */
  id: string;
  /** 上げた後のレベル */
  level: number;
  /** 領地の位置（Match.levelUpChoices の中から選ぶ。選べない組は ValidationErrors の FieldNotFound） */
  position: BoardPositionInput;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** 戦闘のどちら側か */
export type MatchBattleSide =
  /** 攻める側（侵略した側） */
  | 'ATTACKER'
  /** 守る側（領地の持ち主） */
  | 'DEFENDER';

/** 対戦が終わった理由 */
export type MatchEndReason =
  /** ラウンドの上限に達した */
  | 'ROUND_LIMIT'
  /** 目標の魔力に届いて拠点に戻った */
  | 'TARGET_MAGIC';

/** 参加者がプレイヤーか NPC か */
export type MatchParticipantKind =
  /** NPC */
  | 'NPC'
  /** プレイヤー */
  | 'PLAYER';

/** 対戦の段階。今の番の人が次にする操作を表す */
export type MatchPhase =
  /** 侵略を確定した後の段階。攻める側がアイテムを選ぶ（attackMatchTerritory。出さないことも選ぶ）。出せるアイテムが無くても入る */
  | 'ATTACKING'
  /** 分かれ道で行き先を選ぶ段階（chooseMatchPath） */
  | 'CHOOSING_PATH'
  /** 侵略された領地の持ち主がアイテムを選ぶ段階（defendMatchTerritory。出さないことも選ぶ）。操作するのは番の人ではなく awaitingParticipant */
  | 'DEFENDING'
  /** 空いている土地に止まった後の段階。クリーチャーを配置する（deployMatchCreature。配置したらターンを終える）か、配置せずにターンを終える（endMatchTurn） */
  | 'DEPLOYING'
  /** ターンを終えるときに手札が上限を超えているので、上限まで捨てる段階（discardMatchCard）。捨て終えるとターンを終える */
  | 'DISCARDING'
  /** カードを引く段階（drawMatchCard） */
  | 'DRAWING'
  /** 対戦が終わった（戦利品のパックを選ぶ段階も、全員が受け取るまでこのまま。chooseMatchRewardPack） */
  | 'ENDED'
  /** ターンを終える段階（endMatchTurn） */
  | 'ENDING'
  /** 他人の領地に止まった後の段階。通行料を払う（payMatchToll）か、手札のクリーチャーで侵略する（invadeMatchTerritory）。侵略できる手札が無くても入る */
  | 'INVADING'
  /** 通行料を払って魔力が負になったので、自分の領地を手放す段階（relinquishMatchTerritory。0 以上になるまで続く） */
  | 'RELINQUISHING'
  /** サイコロを振る段階（rollMatchDice） */
  | 'ROLLING'
  /** 止まったマスに行動が無く、通った自分の領地があるときの段階。領地コマンドを実行する（levelUpMatchTerritory・exchangeMatchCreature）か、何もしない（endMatchTurn）。行動があるマスでは DEPLOYING・INVADING の中で領地コマンドを選ぶ */
  | 'TERRITORY_COMMANDING';

/** 通った自分の領地のクリーチャーを動かす入力 */
export type MoveMatchCreatureInput = {
  /** 動かすクリーチャーのいる領地の位置 */
  from: BoardPositionInput;
  /** 対戦の公開用の ID */
  id: string;
  /** 画面が見ていた対戦の revision */
  revision: number;
  /** 行き先（Match.moveChoices の中から選ぶ。選べない組は ValidationErrors の FieldNotFound・項目名 to） */
  to: BoardPositionInput;
};

/** 止まった他人の領地の通行料を払う入力 */
export type PayMatchTollInput = {
  /** 対戦の公開用の ID */
  id: string;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** 部屋を公開する入力 */
export type PublishRoomInput = {
  /** 部屋の公開用の ID */
  id: string;
  /** 画面が見ていた部屋の revision */
  revision: number;
};

/** アバターを作る入力 */
export type RegisterAvatarInput = {
  /** 名前（前後の空白を除いて 1 文字以上。長さの上限は ValidationErrors の FieldTooLong の max で返す） */
  name: string;
};

/** 魔力が負の間に、自分の領地を手放す入力 */
export type RelinquishMatchTerritoryInput = {
  /** 対戦の公開用の ID */
  id: string;
  /** 手放す領地の位置（Match.relinquishChoices の中から選ぶ。手放せないものは ValidationErrors の FieldNotFound） */
  position: BoardPositionInput;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** 部屋の名前を変える入力 */
export type RenameRoomInput = {
  /** 部屋の公開用の ID */
  id: string;
  /** 新しい名前（前後の空白を除いて 1〜20 文字。FieldRequired・FieldTooLong の max） */
  name: string;
  /** 画面が見ていた部屋の revision */
  revision: number;
};

/** 休止中の部屋を再開する入力 */
export type ResumeRoomInput = {
  /** 部屋の公開用の ID */
  id: string;
  /** 画面が見ていた部屋の revision */
  revision: number;
};

/** サイコロを振る入力 */
export type RollMatchDiceInput = {
  /** 対戦の公開用の ID */
  id: string;
  /** 画面が見ていた対戦の revision */
  revision: number;
};

/** 部屋を作るのに、作る人が先に持っていなければならないもの */
export type RoomRequirement =
  /** アバター（自分の席に座るアバター） */
  | 'AVATAR'
  /** デッキ（自分の席で使うデッキ。スターターの配布が終わると持つ） */
  | 'DECK';

/** 席に座るのがプレイヤーか NPC か。形式（個人戦／チーム戦）とチームは持たない */
export type RoomSeatKind =
  /** NPC の席 */
  | 'NPC'
  /** プレイヤーの席。今は 1 つで、作った人が座る */
  | 'PLAYER';

/** 部屋の状態。公開は同時に準備中に進む（今は公開しただけの状態を持たない）。全員が準備完了を申告すると対戦中に進み、対戦が終わると次を決める状態に進む */
export type RoomStatus =
  /** 閉じた（作った人が閉じた）。一覧には出ない */
  | 'CLOSED'
  /** 次を決める（対戦が終わり、全員が戦利品を受け取り終えた後）。参加している人が declareRoomNext で続けるか終えるかを選ぶ。誰かが終えるなら休止中、全員が続けるなら準備中に戻る */
  | 'DECIDING_NEXT'
  /** 公開前（マスタの「準備中」と分けて、公開前と呼ぶ）。席・対戦ルール・席の選択を何でも決められる */
  | 'DRAFT'
  /** 休止中（対戦の後に誰かが終えた。今日はここまで）。一覧に残り、作った人が resumeRoom で再開すると準備中に戻る */
  | 'PAUSED'
  /** 対戦中（全員が準備完了を申告して、対戦が始まった）。対戦は Room.match */
  | 'PLAYING'
  /** 準備中（公開した後、全員の準備完了まで）。公開前に決めなかったものを、担当の人が決める */
  | 'PREPARING';

/** スターターの配布の状態 */
export type StarterGrantStatus =
  /** 所持カード・デッキ・解放がそろった */
  | 'COMPLETED'
  /** まだ届いていない（登録の直後で配布が始まっていない・配っている途中を含む） */
  | 'IN_PROGRESS';

/** サイコロを振る前にスペルを使う入力 */
export type UseMatchSpellInput = {
  /** 使うスペルの手札の番号（0 始まり。Match.spellChoices の中から選ぶ。手札の範囲の外は ValidationErrors の FieldOutOfRange、範囲の中で使えないものは FieldNotFound） */
  handIndex: number;
  /** 対戦の公開用の ID */
  id: string;
  /** 画面が見ていた対戦の revision */
  revision: number;
  /** 対象のプレイヤー（Match.participants の何番目か。spellChoices の targets の中から選ぶ。呪いのスペルで無ければ FieldRequired、対象を選ばないスペルに付けた・選べない対象は FieldNotFound） */
  target?: number | null | undefined;
};

export type RegisterAvatarMutationVariables = Exact<{
  input: RegisterAvatarInput;
}>;


export type RegisterAvatarMutation = { registerAvatar:
    | { __typename: 'AvatarLimitReachedError', max: number }
    | { __typename: 'AvatarNameAlreadyInUseError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RegisterAvatarSuccess', avatar: { id: string } }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch' }
        | { __typename: 'FieldInvalidFormat' }
        | { __typename: 'FieldNotFound' }
        | { __typename: 'FieldNotGreaterThan' }
        | { __typename: 'FieldOutOfRange' }
        | { __typename: 'FieldRequired' }
        | { __typename: 'FieldTooLong', max: number }
        | { __typename: 'FieldTooSmall' }
      > }
   };

export type AvatarIdsQueryVariables = Exact<{ [key: string]: never; }>;


export type AvatarIdsQuery = { me:
    | { __typename: 'Player', avatars: Array<{ id: string }> }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type BoardQueryVariables = Exact<{
  id: string;
}>;


export type BoardQuery = { board:
    | { __typename: 'Board', id: string, name: string, width: number, height: number, tiles: Array<
        | { __typename: 'BaseTile', x: number, y: number }
        | { __typename: 'BridgeTile', x: number, y: number }
        | { __typename: 'CardShopTile', x: number, y: number }
        | { __typename: 'CheckpointTile', x: number, y: number }
        | { __typename: 'LandTile', element: BoardTileElement, x: number, y: number }
        | { __typename: 'ProphecyShopTile', x: number, y: number }
        | { __typename: 'SanctuaryTile', x: number, y: number }
        | { __typename: 'ShrineTile', x: number, y: number }
        | { __typename: 'WarpTile', x: number, y: number }
      >, pairs: Array<{ a: { x: number, y: number }, b: { x: number, y: number } }>, defaultRules: { targetMagic: number, startingMagic: number, lapBonus: number, checkpointBonus: number, roundLimit: number, diceMin: number, diceMax: number, baseLandValue: number } }
    | { __typename: 'BoardNotFoundError' }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type BoardsQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type BoardsQuery = { boards:
    | { __typename: 'BoardsConnection', edges: Array<{ node: { id: string, name: string, width: number, height: number, tileCounts: { land: number, base: number, checkpoint: number, fire: number, earth: number, water: number, wind: number, neutral: number, multi: number, warp: number, bridge: number, sanctuary: number, shrine: number, prophecyShop: number, cardShop: number }, defaultRules: { targetMagic: number, startingMagic: number, lapBonus: number, checkpointBonus: number, roundLimit: number, diceMin: number, diceMax: number, baseLandValue: number } } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'ValidationErrors' }
   };

export type CardQueryVariables = Exact<{
  id: string;
}>;


export type CardQuery = { card:
    | { __typename: 'CardNotFoundError' }
    | { __typename: 'CreatureCardInfo', id: string, name: string, cost: number, rarity: CardRarity, elements: Array<CreatureElement>, attack: number, hitPoints: number, movement: number }
    | { __typename: 'ItemCardInfo', id: string, name: string, cost: number, rarity: CardRarity, category: ItemCategory, attackBonus: number, hitPointsBonus: number }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity, effect:
        | { __typename: 'SpellDrawCardsEffect', count: number }
        | { __typename: 'SpellFixedDiceCurseEffect', value: number, turns: number }
        | { __typename: 'SpellGainMagicEffect', perLap: number }
        | { __typename: 'SpellRollDiceEffect', count: number }
       | null }
   };

export type CollectionQueryVariables = Exact<{
  filter?: CollectionFilter | null | undefined;
  after?: string | null | undefined;
}>;


export type CollectionQuery = { me:
    | { __typename: 'Player', collection:
        | { __typename: 'CollectionCardConnection', edges: Array<{ node: { count: number, card:
                | { __typename: 'CreatureCardInfo', id: string, name: string, cost: number, rarity: CardRarity }
                | { __typename: 'ItemCardInfo', id: string, name: string, cost: number, rarity: CardRarity }
                | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity }
               } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } }
        | { __typename: 'ValidationErrors' }
       }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type PlayerDeckQueryVariables = Exact<{
  id: string;
}>;


export type PlayerDeckQuery = { deck:
    | { __typename: 'Deck', id: string, name: string, totalCount: number, cards: Array<{ count: number, card:
          | { __typename: 'CreatureCardInfo', id: string, name: string, cost: number, rarity: CardRarity }
          | { __typename: 'ItemCardInfo', id: string, name: string, cost: number, rarity: CardRarity }
          | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity }
         }> }
    | { __typename: 'DeckNotFoundError' }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type PlayerDecksQueryVariables = Exact<{ [key: string]: never; }>;


export type PlayerDecksQuery = { me:
    | { __typename: 'Player', decks: Array<{ id: string, name: string, totalCount: number, typeCounts: { creature: number, item: number, spell: number } }> }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type MatchDebugQueryVariables = Exact<{
  id: string;
}>;


export type MatchDebugQuery = { match:
    | { __typename: 'Match', id: string, roomId: string | null, number: number | null, revision: number, round: number, phase: MatchPhase, dice: number | null, remainingSteps: number, deployChoices: Array<number>, invadeChoices: Array<number>, itemChoices: Array<number>, currentParticipant: number | null, awaitingParticipant: number | null, pathChoices: Array<{ x: number, y: number }>, spellChoices: Array<{ handIndex: number, targets: Array<number> }>, relinquishChoices: Array<{ x: number, y: number }>, moveChoices: Array<{ from: { x: number, y: number }, to: { x: number, y: number } }>, landLevels: Array<{ level: number, position: { x: number, y: number } }>, levelUpChoices: Array<{ level: number, magic: number, position: { x: number, y: number } }>, exchangeChoices: Array<{ handIndex: number, magic: number, position: { x: number, y: number } }>, elementChangeChoices: Array<{ element: BoardTileElement, magic: number, position: { x: number, y: number } }>, invasion: { hitPoints: number, position: { x: number, y: number }, card: { __typename: 'CreatureCardInfo', id: string, name: string, cost: number, rarity: CardRarity, elements: Array<CreatureElement>, attack: number, hitPoints: number } } | null, territories: Array<{ owner: number, level: number, value: number, toll: number, relinquishMagic: number, position: { x: number, y: number }, creature: { id: number, hitPoints: number, card: { id: string, name: string, attack: number } } }>, outcome: { winners: Array<number>, reason: MatchEndReason, ranks: Array<number> } | null, rewardPacks: Array<{ key: string, name: string }>, rules: { targetMagic: number, startingMagic: number, lapBonus: number, checkpointBonus: number, roundLimit: number, diceMin: number, diceMax: number, baseLandValue: number, maxHandCards: number, startingHandCards: number, tollPercentage: number, relinquishPercentage: number }, board: { width: number, height: number, tiles: Array<
          | { __typename: 'BaseTile', x: number, y: number }
          | { __typename: 'BridgeTile', x: number, y: number }
          | { __typename: 'CardShopTile', x: number, y: number }
          | { __typename: 'CheckpointTile', x: number, y: number }
          | { __typename: 'LandTile', element: BoardTileElement, x: number, y: number }
          | { __typename: 'ProphecyShopTile', x: number, y: number }
          | { __typename: 'SanctuaryTile', x: number, y: number }
          | { __typename: 'ShrineTile', x: number, y: number }
          | { __typename: 'WarpTile', x: number, y: number }
        >, pairs: Array<{ a: { x: number, y: number }, b: { x: number, y: number } }> }, participants: Array<{ kind: MatchParticipantKind, playerId: string | null, magic: number, totalMagic: number, drawPileCount: number, turnOrder: number, rewardReceived: boolean, avatar: { name: string }, position: { x: number, y: number }, hand: Array<
          | { __typename: 'CreatureCardInfo', elements: Array<CreatureElement>, attack: number, hitPoints: number, movement: number, id: string, name: string, cost: number, rarity: CardRarity }
          | { __typename: 'ItemCardInfo', category: ItemCategory, attackBonus: number, hitPointsBonus: number, id: string, name: string, cost: number, rarity: CardRarity }
          | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity, effect:
              | { __typename: 'SpellDrawCardsEffect', count: number }
              | { __typename: 'SpellFixedDiceCurseEffect', value: number, turns: number }
              | { __typename: 'SpellGainMagicEffect', perLap: number }
              | { __typename: 'SpellRollDiceEffect', count: number }
             | null }
        >, discardPile: Array<
          | { id: string, name: string }
          | { id: string, name: string }
          | { id: string, name: string }
        >, curse: { remainingTurns: number, effect: { __typename: 'MatchFixedDiceCurse', value: number } } | null, passedCheckpoints: Array<{ x: number, y: number }>, rewardCards: Array<
          | { name: string }
          | { name: string }
          | { name: string }
        > }> }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type MatchDebugEventsQueryVariables = Exact<{
  id: string;
  after: number;
}>;


export type MatchDebugEventsQuery = { matchEvents:
    | { __typename: 'MatchEventList', events: Array<
        | { __typename: 'MatchBattleStartedEvent', revision: number, attacker: { attack: number, hitPoints: number }, defender: { attack: number, hitPoints: number }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchBattleStatModifiedEvent', side: MatchBattleSide, attackDelta: number, hitPointsDelta: number, attack: number, hitPoints: number, revision: number, source:
            | { __typename: 'MatchAdjacentTerritoriesSource', positions: Array<{ x: number, y: number }> }
            | { __typename: 'MatchItemSource', card:
                | { id: string, name: string }
                | { id: string, name: string }
                | { id: string, name: string }
               }
            | { __typename: 'MatchTerrainSource', element: BoardTileElement, level: number }
          , changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchCardDiscardedEvent', participant: number, handIndex: number, revision: number, card:
            | { __typename: 'CreatureCardInfo', elements: Array<CreatureElement>, attack: number, hitPoints: number, movement: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'ItemCardInfo', category: ItemCategory, attackBonus: number, hitPointsBonus: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity, effect:
                | { __typename: 'SpellDrawCardsEffect', count: number }
                | { __typename: 'SpellFixedDiceCurseEffect', value: number, turns: number }
                | { __typename: 'SpellGainMagicEffect', perLap: number }
                | { __typename: 'SpellRollDiceEffect', count: number }
               | null }
          , changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchCardDrawnEvent', participant: number, revision: number, card:
            | { __typename: 'CreatureCardInfo', elements: Array<CreatureElement>, attack: number, hitPoints: number, movement: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'ItemCardInfo', category: ItemCategory, attackBonus: number, hitPointsBonus: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity, effect:
                | { __typename: 'SpellDrawCardsEffect', count: number }
                | { __typename: 'SpellFixedDiceCurseEffect', value: number, turns: number }
                | { __typename: 'SpellGainMagicEffect', perLap: number }
                | { __typename: 'SpellRollDiceEffect', count: number }
               | null }
          , changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchCheckpointPassedEvent', participant: number, magic: number, revision: number, checkpoint: { x: number, y: number }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchCreatedEvent', revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchCreatureDeployedEvent', participant: number, handIndex: number, creature: number, cost: number, revision: number, card:
            | { __typename: 'CreatureCardInfo', elements: Array<CreatureElement>, attack: number, hitPoints: number, movement: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'ItemCardInfo', category: ItemCategory, attackBonus: number, hitPointsBonus: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity, effect:
                | { __typename: 'SpellDrawCardsEffect', count: number }
                | { __typename: 'SpellFixedDiceCurseEffect', value: number, turns: number }
                | { __typename: 'SpellGainMagicEffect', perLap: number }
                | { __typename: 'SpellRollDiceEffect', count: number }
               | null }
          , position: { x: number, y: number }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchCreatureExchangedEvent', participant: number, handIndex: number, creature: number, cost: number, revision: number, position: { x: number, y: number }, card:
            | { __typename: 'CreatureCardInfo', elements: Array<CreatureElement>, attack: number, hitPoints: number, movement: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'ItemCardInfo', category: ItemCategory, attackBonus: number, hitPointsBonus: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity, effect:
                | { __typename: 'SpellDrawCardsEffect', count: number }
                | { __typename: 'SpellFixedDiceCurseEffect', value: number, turns: number }
                | { __typename: 'SpellGainMagicEffect', perLap: number }
                | { __typename: 'SpellRollDiceEffect', count: number }
               | null }
          , returnedCard:
            | { __typename: 'CreatureCardInfo', elements: Array<CreatureElement>, attack: number, hitPoints: number, movement: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'ItemCardInfo', category: ItemCategory, attackBonus: number, hitPointsBonus: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity, effect:
                | { __typename: 'SpellDrawCardsEffect', count: number }
                | { __typename: 'SpellFixedDiceCurseEffect', value: number, turns: number }
                | { __typename: 'SpellGainMagicEffect', perLap: number }
                | { __typename: 'SpellRollDiceEffect', count: number }
               | null }
          , changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchCreatureMovedEvent', participant: number, creature: number, revision: number, from: { x: number, y: number }, to: { x: number, y: number }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchCreatureStruckEvent', striker: MatchBattleSide, damage: number, remainingHitPoints: number, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchCurseCastEvent', participant: number, target: number, revision: number, curse: { remainingTurns: number, effect: { __typename: 'MatchFixedDiceCurse', value: number } }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchCurseRemovedEvent', participant: number, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchDecksShuffledEvent', revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchDiceCountChangedEvent', participant: number, count: number, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchDiceRolledEvent', participant: number, value: number, dice: Array<number>, fixedByCurse: boolean, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchDiscardPileShuffledEvent', participant: number, drawPileCount: number, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchEndedEvent', winners: Array<number>, ranks: Array<number>, reason: MatchEndReason, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchHandLimitExceededEvent', participant: number, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchHandsDealtEvent', cards: number, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchInvasionRepelledEvent', participant: number, territoryHitPoints: number, returnedHitPoints: number | null, returnedToHand: boolean, revision: number, returnedTo: { x: number, y: number } | null, position: { x: number, y: number }, card:
            | { __typename: 'CreatureCardInfo', elements: Array<CreatureElement>, attack: number, hitPoints: number, movement: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'ItemCardInfo', category: ItemCategory, attackBonus: number, hitPointsBonus: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity, effect:
                | { __typename: 'SpellDrawCardsEffect', count: number }
                | { __typename: 'SpellFixedDiceCurseEffect', value: number, turns: number }
                | { __typename: 'SpellGainMagicEffect', perLap: number }
                | { __typename: 'SpellRollDiceEffect', count: number }
               | null }
          , changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchItemSkippedEvent', participant: number, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchItemUsedEvent', participant: number, handIndex: number, cost: number, revision: number, card:
            | { __typename: 'CreatureCardInfo', elements: Array<CreatureElement>, attack: number, hitPoints: number, movement: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'ItemCardInfo', category: ItemCategory, attackBonus: number, hitPointsBonus: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity, effect:
                | { __typename: 'SpellDrawCardsEffect', count: number }
                | { __typename: 'SpellFixedDiceCurseEffect', value: number, turns: number }
                | { __typename: 'SpellGainMagicEffect', perLap: number }
                | { __typename: 'SpellRollDiceEffect', count: number }
               | null }
          , changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchLandElementChangedEvent', participant: number, element: BoardTileElement, magic: number, revision: number, position: { x: number, y: number }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchLapCompletedEvent', participant: number, magic: number, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchMagicDepletedEvent', participant: number, magic: number, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchMagicGainedEvent', participant: number, magic: number, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchMovedEvent', participant: number, revision: number, to: { x: number, y: number }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchRewardDrawnEvent', participant: number, pack: string, revision: number, rewardCards: Array<
            | { name: string }
            | { name: string }
            | { name: string }
          >, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchRewardsCompletedEvent', revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchSpellUsedEvent', participant: number, handIndex: number, cost: number, revision: number, card:
            | { __typename: 'CreatureCardInfo', id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'ItemCardInfo', id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity }
          , changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchTerritoryConqueredEvent', participant: number, defeatedCreature: number, creature: number, territoryHitPoints: number, revision: number, position: { x: number, y: number }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchTerritoryInvadedByMoveEvent', participant: number, creature: number, revision: number, from: { x: number, y: number }, position: { x: number, y: number }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchTerritoryInvadedEvent', participant: number, handIndex: number, cost: number, revision: number, card:
            | { __typename: 'CreatureCardInfo', elements: Array<CreatureElement>, attack: number, hitPoints: number, movement: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'ItemCardInfo', category: ItemCategory, attackBonus: number, hitPointsBonus: number, id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity, effect:
                | { __typename: 'SpellDrawCardsEffect', count: number }
                | { __typename: 'SpellFixedDiceCurseEffect', value: number, turns: number }
                | { __typename: 'SpellGainMagicEffect', perLap: number }
                | { __typename: 'SpellRollDiceEffect', count: number }
               | null }
          , position: { x: number, y: number }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchTerritoryLeveledUpEvent', participant: number, level: number, magic: number, revision: number, position: { x: number, y: number }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchTerritoryRelinquishedEvent', participant: number, creature: number, magic: number, revision: number, position: { x: number, y: number }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchTollPaidEvent', participant: number, owner: number, magic: number, revision: number, position: { x: number, y: number }, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchTurnEndedEvent', participant: number, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
        | { __typename: 'MatchTurnOrderDecidedEvent', order: Array<number>, revision: number, changes: { phase: MatchPhase | null, totalMagics: Array<{ participant: number, totalMagic: number }>, territoryValues: Array<{ value: number, toll: number, position: { x: number, y: number } }> } }
      > }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type DrawMatchCardMutationVariables = Exact<{
  input: DrawMatchCardInput;
}>;


export type DrawMatchCardMutation = { drawMatchCard:
    | { __typename: 'DrawMatchCardSuccess' }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
   };

export type DiscardMatchCardMutationVariables = Exact<{
  input: DiscardMatchCardInput;
}>;


export type DiscardMatchCardMutation = { discardMatchCard:
    | { __typename: 'DiscardMatchCardSuccess' }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', min: number, max: number, field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type UseMatchSpellMutationVariables = Exact<{
  input: UseMatchSpellInput;
}>;


export type UseMatchSpellMutation = { useMatchSpell:
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'UseMatchSpellSuccess' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', min: number, max: number, field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type DeployMatchCreatureMutationVariables = Exact<{
  input: DeployMatchCreatureInput;
}>;


export type DeployMatchCreatureMutation = { deployMatchCreature:
    | { __typename: 'DeployMatchCreatureSuccess' }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', min: number, max: number, field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type RelinquishMatchTerritoryMutationVariables = Exact<{
  input: RelinquishMatchTerritoryInput;
}>;


export type RelinquishMatchTerritoryMutation = { relinquishMatchTerritory:
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RelinquishMatchTerritorySuccess' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type LevelUpMatchTerritoryMutationVariables = Exact<{
  input: LevelUpMatchTerritoryInput;
}>;


export type LevelUpMatchTerritoryMutation = { levelUpMatchTerritory:
    | { __typename: 'LevelUpMatchTerritorySuccess' }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type MoveMatchCreatureMutationVariables = Exact<{
  input: MoveMatchCreatureInput;
}>;


export type MoveMatchCreatureMutation = { moveMatchCreature:
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'MoveMatchCreatureSuccess' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type ChangeMatchLandElementMutationVariables = Exact<{
  input: ChangeMatchLandElementInput;
}>;


export type ChangeMatchLandElementMutation = { changeMatchLandElement:
    | { __typename: 'ChangeMatchLandElementSuccess' }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type ExchangeMatchCreatureMutationVariables = Exact<{
  input: ExchangeMatchCreatureInput;
}>;


export type ExchangeMatchCreatureMutation = { exchangeMatchCreature:
    | { __typename: 'ExchangeMatchCreatureSuccess' }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type RollMatchDiceMutationVariables = Exact<{
  input: RollMatchDiceInput;
}>;


export type RollMatchDiceMutation = { rollMatchDice:
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'RollMatchDiceSuccess' }
   };

export type ChooseMatchPathMutationVariables = Exact<{
  input: ChooseMatchPathInput;
}>;


export type ChooseMatchPathMutation = { chooseMatchPath:
    | { __typename: 'ChooseMatchPathSuccess' }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', min: number, max: number, field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type EndMatchTurnMutationVariables = Exact<{
  input: EndMatchTurnInput;
}>;


export type EndMatchTurnMutation = { endMatchTurn:
    | { __typename: 'EndMatchTurnSuccess' }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
   };

export type ChooseMatchRewardPackMutationVariables = Exact<{
  input: ChooseMatchRewardPackInput;
}>;


export type ChooseMatchRewardPackMutation = { chooseMatchRewardPack:
    | { __typename: 'ChooseMatchRewardPackSuccess' }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'MatchRewardAlreadyReceivedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type InvadeMatchTerritoryMutationVariables = Exact<{
  input: InvadeMatchTerritoryInput;
}>;


export type InvadeMatchTerritoryMutation = { invadeMatchTerritory:
    | { __typename: 'InvadeMatchTerritorySuccess' }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', min: number, max: number, field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type AttackMatchTerritoryMutationVariables = Exact<{
  input: AttackMatchTerritoryInput;
}>;


export type AttackMatchTerritoryMutation = { attackMatchTerritory:
    | { __typename: 'AttackMatchTerritorySuccess' }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', min: number, max: number, field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type PayMatchTollMutationVariables = Exact<{
  input: PayMatchTollInput;
}>;


export type PayMatchTollMutation = { payMatchToll:
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PayMatchTollSuccess' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
   };

export type DefendMatchTerritoryMutationVariables = Exact<{
  input: DefendMatchTerritoryInput;
}>;


export type DefendMatchTerritoryMutation = { defendMatchTerritory:
    | { __typename: 'DefendMatchTerritorySuccess' }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'MatchNotYourTurnError' }
    | { __typename: 'MatchPhaseNotAllowedError' }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', min: number, max: number, field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type NpcAvatarQueryVariables = Exact<{
  id: string;
}>;


export type NpcAvatarQuery = { npcAvatar:
    | { __typename: 'NpcAvatar', id: string, name: string, decks: Array<{ id: string, name: string, totalCount: number, cards: Array<{ count: number, card:
            | { __typename: 'CreatureCardInfo', id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'ItemCardInfo', id: string, name: string, cost: number, rarity: CardRarity }
            | { __typename: 'SpellCardInfo', id: string, name: string, cost: number, rarity: CardRarity }
           }> }> }
    | { __typename: 'NpcAvatarNotFoundError' }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type NpcAvatarsQueryVariables = Exact<{ [key: string]: never; }>;


export type NpcAvatarsQuery = { me:
    | { __typename: 'Player', npcAvatars: Array<{ id: string, name: string, decks: Array<{ id: string, name: string }> }> }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type RoomDetailQueryVariables = Exact<{
  id: string;
}>;


export type RoomDetailQuery = { room:
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'Room', id: string, revision: number, name: string, status: RoomStatus, match: { id: string } | null, matches: Array<{ id: string, number: number }>, capabilities: { changeSeats: boolean, changeMatchRules: boolean, publish: boolean, declareReady: boolean, declareNext: boolean, resume: boolean, close: boolean, rename: boolean } | null, participants: Array<{ playerId: string, owner: boolean, ready: boolean, continues: boolean | null }>, seats: Array<{ kind: RoomSeatKind, playerId: string | null, choiceChangeable: boolean | null, avatar: { id: string, name: string } | null, deck: { id: string, name: string } | null }>, matchRules: { targetMagic: number, startingMagic: number, lapBonus: number, checkpointBonus: number, roundLimit: number, diceMin: number, diceMax: number, baseLandValue: number, board: { id: string, name: string } } | null }
    | { __typename: 'RoomNotFoundError' }
  , me:
    | { __typename: 'Player', id: string, avatars: Array<{ id: string, name: string }>, decks: Array<{ id: string, name: string }>, boards: Array<{ id: string, name: string, defaultRules: { targetMagic: number, startingMagic: number, lapBonus: number, checkpointBonus: number, roundLimit: number, diceMin: number, diceMax: number, baseLandValue: number } }>, npcAvatars: Array<{ id: string, name: string, decks: Array<{ id: string, name: string }> }> }
    | { __typename: 'PlayerNotRegisteredError' }
  , gameRules:
    | { __typename: 'GameRules', match: { minPlayers: number, maxPlayers: number } }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type CreateRoomMutationVariables = Exact<{
  input: CreateRoomInput;
}>;


export type CreateRoomMutation = { createRoom:
    | { __typename: 'CreateRoomSuccess', id: string, revision: number }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RoomRequirementsNotMetError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch' }
        | { __typename: 'FieldInvalidFormat' }
        | { __typename: 'FieldNotFound' }
        | { __typename: 'FieldNotGreaterThan' }
        | { __typename: 'FieldOutOfRange' }
        | { __typename: 'FieldRequired' }
        | { __typename: 'FieldTooLong', max: number }
        | { __typename: 'FieldTooSmall' }
      > }
   };

export type RenameRoomMutationVariables = Exact<{
  input: RenameRoomInput;
}>;


export type RenameRoomMutation = { renameRoom:
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RenameRoomSuccess', id: string, revision: number }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'RoomNotFoundError' }
    | { __typename: 'RoomNotResponsibleError' }
    | { __typename: 'RoomStatusNotAllowedError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', field: string }
        | { __typename: 'FieldOutOfRange', field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', max: number, field: string }
        | { __typename: 'FieldTooSmall', field: string }
      > }
   };

export type ChangeRoomSeatsMutationVariables = Exact<{
  input: ChangeRoomSeatsInput;
}>;


export type ChangeRoomSeatsMutation = { changeRoomSeats:
    | { __typename: 'ChangeRoomSeatsSuccess', id: string, revision: number }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'RoomNotFoundError' }
    | { __typename: 'RoomNotResponsibleError' }
    | { __typename: 'RoomStatusNotAllowedError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', expected: number, field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', than: string, field: string }
        | { __typename: 'FieldOutOfRange', min: number, max: number, field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', min: number, field: string }
      > }
   };

export type ChangeRoomMatchRulesMutationVariables = Exact<{
  input: ChangeRoomMatchRulesInput;
}>;


export type ChangeRoomMatchRulesMutation = { changeRoomMatchRules:
    | { __typename: 'ChangeRoomMatchRulesSuccess', id: string, revision: number }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'RoomAlreadyReadyError' }
    | { __typename: 'RoomConditionLockedError' }
    | { __typename: 'RoomNotFoundError' }
    | { __typename: 'RoomNotResponsibleError' }
    | { __typename: 'RoomStatusNotAllowedError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', expected: number, field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', than: string, field: string }
        | { __typename: 'FieldOutOfRange', min: number, max: number, field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', min: number, field: string }
      > }
   };

export type ChangeRoomSeatChoiceMutationVariables = Exact<{
  input: ChangeRoomSeatChoiceInput;
}>;


export type ChangeRoomSeatChoiceMutation = { changeRoomSeatChoice:
    | { __typename: 'ChangeRoomSeatChoiceSuccess', id: string, revision: number }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'RoomAlreadyReadyError' }
    | { __typename: 'RoomConditionLockedError' }
    | { __typename: 'RoomNotFoundError' }
    | { __typename: 'RoomNotResponsibleError' }
    | { __typename: 'RoomSeatsNotDecidedError' }
    | { __typename: 'RoomStatusNotAllowedError' }
    | { __typename: 'ValidationErrors', errors: Array<
        | { __typename: 'FieldCountMismatch', expected: number, field: string }
        | { __typename: 'FieldInvalidFormat', field: string }
        | { __typename: 'FieldNotFound', field: string }
        | { __typename: 'FieldNotGreaterThan', than: string, field: string }
        | { __typename: 'FieldOutOfRange', min: number, max: number, field: string }
        | { __typename: 'FieldRequired', field: string }
        | { __typename: 'FieldTooLong', field: string }
        | { __typename: 'FieldTooSmall', min: number, field: string }
      > }
   };

export type PublishRoomMutationVariables = Exact<{
  input: PublishRoomInput;
}>;


export type PublishRoomMutation = { publishRoom:
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'PublishRoomSuccess', id: string, revision: number }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'RoomNotFoundError' }
    | { __typename: 'RoomNotResponsibleError' }
    | { __typename: 'RoomSeatsNotDecidedError' }
    | { __typename: 'RoomStatusNotAllowedError' }
   };

export type DeclareRoomReadyMutationVariables = Exact<{
  input: DeclareRoomReadyInput;
}>;


export type DeclareRoomReadyMutation = { declareRoomReady:
    | { __typename: 'DeclareRoomReadySuccess', id: string, revision: number }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'RoomAlreadyReadyError' }
    | { __typename: 'RoomConditionsNotDecidedError' }
    | { __typename: 'RoomNotFoundError' }
    | { __typename: 'RoomNotResponsibleError' }
    | { __typename: 'RoomStatusNotAllowedError' }
   };

export type DeclareRoomNextMutationVariables = Exact<{
  input: DeclareRoomNextInput;
}>;


export type DeclareRoomNextMutation = { declareRoomNext:
    | { __typename: 'DeclareRoomNextSuccess', id: string, revision: number }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'RoomAlreadyDeclaredNextError' }
    | { __typename: 'RoomNotFoundError' }
    | { __typename: 'RoomStatusNotAllowedError' }
   };

export type ResumeRoomMutationVariables = Exact<{
  input: ResumeRoomInput;
}>;


export type ResumeRoomMutation = { resumeRoom:
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'ResumeRoomSuccess', id: string, revision: number }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'RoomNotFoundError' }
    | { __typename: 'RoomNotResponsibleError' }
    | { __typename: 'RoomStatusNotAllowedError' }
   };

export type CloseRoomMutationVariables = Exact<{
  input: CloseRoomInput;
}>;


export type CloseRoomMutation = { closeRoom:
    | { __typename: 'CloseRoomSuccess', id: string, revision: number }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RevisionConflictError' }
    | { __typename: 'RoomNotFoundError' }
    | { __typename: 'RoomNotResponsibleError' }
    | { __typename: 'RoomStatusNotAllowedError' }
   };

export type RoomRevisionQueryVariables = Exact<{
  id: string;
}>;


export type RoomRevisionQuery = { room:
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'Room', revision: number }
    | { __typename: 'RoomNotFoundError' }
   };

export type RoomMatchQueryVariables = Exact<{
  id: string;
}>;


export type RoomMatchQuery = { room:
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'Room', match: { id: string } | null }
    | { __typename: 'RoomNotFoundError' }
   };

export type MyRoomsQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type MyRoomsQuery = { me:
    | { __typename: 'Player', roomRequirements: Array<RoomRequirement> }
    | { __typename: 'PlayerNotRegisteredError' }
  , myRooms:
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'RoomsConnection', edges: Array<{ node: { id: string, name: string, status: RoomStatus, seats: Array<{ kind: RoomSeatKind }>, matchRules: { board: { name: string } } | null } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } }
    | { __typename: 'ValidationErrors' }
   };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me:
    | { __typename: 'Player', id: string, starterGrant: StarterGrantStatus, avatars: Array<{ id: string, name: string }> }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type RegisterPlayerMutationVariables = Exact<{ [key: string]: never; }>;


export type RegisterPlayerMutation = { registerPlayer: { __typename: 'RegisterPlayerSuccess' } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const RegisterAvatarDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<RegisterAvatarMutation, RegisterAvatarMutationVariables>;
export const AvatarIdsDocument = new TypedDocumentString(`
    query AvatarIds {
  me {
    __typename
    ... on Player {
      avatars {
        id
      }
    }
  }
}
    `) as unknown as TypedDocumentString<AvatarIdsQuery, AvatarIdsQueryVariables>;
export const BoardDocument = new TypedDocumentString(`
    query Board($id: UUID!) {
  board(id: $id) {
    __typename
    ... on Board {
      id
      name
      width
      height
      tiles {
        __typename
        x
        y
        ... on LandTile {
          element
        }
      }
      pairs {
        a {
          x
          y
        }
        b {
          x
          y
        }
      }
      defaultRules {
        targetMagic
        startingMagic
        lapBonus
        checkpointBonus
        roundLimit
        diceMin
        diceMax
        baseLandValue
      }
    }
  }
}
    `) as unknown as TypedDocumentString<BoardQuery, BoardQueryVariables>;
export const BoardsDocument = new TypedDocumentString(`
    query Boards($after: String) {
  boards(after: $after) {
    __typename
    ... on BoardsConnection {
      edges {
        node {
          id
          name
          width
          height
          tileCounts {
            land
            base
            checkpoint
            fire
            earth
            water
            wind
            neutral
            multi
            warp
            bridge
            sanctuary
            shrine
            prophecyShop
            cardShop
          }
          defaultRules {
            targetMagic
            startingMagic
            lapBonus
            checkpointBonus
            roundLimit
            diceMin
            diceMax
            baseLandValue
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
    `) as unknown as TypedDocumentString<BoardsQuery, BoardsQueryVariables>;
export const CardDocument = new TypedDocumentString(`
    query Card($id: UUID!) {
  card(id: $id) {
    __typename
    ... on CardInfo {
      id
      name
      cost
      rarity
    }
    ... on CreatureCardInfo {
      elements
      attack
      hitPoints
      movement
    }
    ... on ItemCardInfo {
      category
      attackBonus
      hitPointsBonus
    }
    ... on SpellCardInfo {
      effect {
        __typename
        ... on SpellDrawCardsEffect {
          count
        }
        ... on SpellGainMagicEffect {
          perLap
        }
        ... on SpellRollDiceEffect {
          count
        }
        ... on SpellFixedDiceCurseEffect {
          value
          turns
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<CardQuery, CardQueryVariables>;
export const CollectionDocument = new TypedDocumentString(`
    query Collection($filter: CollectionFilter, $after: String) {
  me {
    __typename
    ... on Player {
      collection(filter: $filter, after: $after) {
        __typename
        ... on CollectionCardConnection {
          edges {
            node {
              count
              card {
                __typename
                id
                name
                cost
                rarity
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<CollectionQuery, CollectionQueryVariables>;
export const PlayerDeckDocument = new TypedDocumentString(`
    query PlayerDeck($id: UUID!) {
  deck(id: $id) {
    __typename
    ... on Deck {
      id
      name
      totalCount
      cards {
        count
        card {
          __typename
          id
          name
          cost
          rarity
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<PlayerDeckQuery, PlayerDeckQueryVariables>;
export const PlayerDecksDocument = new TypedDocumentString(`
    query PlayerDecks {
  me {
    __typename
    ... on Player {
      decks {
        id
        name
        totalCount
        typeCounts {
          creature
          item
          spell
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<PlayerDecksQuery, PlayerDecksQueryVariables>;
export const MatchDebugDocument = new TypedDocumentString(`
    query MatchDebug($id: UUID!) {
  match(id: $id) {
    __typename
    ... on Match {
      id
      roomId
      number
      revision
      round
      phase
      dice
      remainingSteps
      pathChoices {
        x
        y
      }
      spellChoices {
        handIndex
        targets
      }
      deployChoices
      invadeChoices
      itemChoices
      relinquishChoices {
        x
        y
      }
      moveChoices {
        from {
          x
          y
        }
        to {
          x
          y
        }
      }
      landLevels {
        position {
          x
          y
        }
        level
      }
      levelUpChoices {
        position {
          x
          y
        }
        level
        magic
      }
      exchangeChoices {
        position {
          x
          y
        }
        handIndex
        magic
      }
      elementChangeChoices {
        position {
          x
          y
        }
        element
        magic
      }
      invasion {
        position {
          x
          y
        }
        card {
          __typename
          id
          name
          cost
          rarity
          elements
          attack
          hitPoints
        }
        hitPoints
      }
      territories {
        position {
          x
          y
        }
        owner
        level
        value
        toll
        relinquishMagic
        creature {
          id
          hitPoints
          card {
            id
            name
            attack
          }
        }
      }
      outcome {
        winners
        reason
        ranks
      }
      rewardPacks {
        key
        name
      }
      rules {
        targetMagic
        startingMagic
        lapBonus
        checkpointBonus
        roundLimit
        diceMin
        diceMax
        baseLandValue
        maxHandCards
        startingHandCards
        tollPercentage
        relinquishPercentage
      }
      board {
        width
        height
        tiles {
          __typename
          x
          y
          ... on LandTile {
            element
          }
        }
        pairs {
          a {
            x
            y
          }
          b {
            x
            y
          }
        }
      }
      participants {
        kind
        playerId
        avatar {
          name
        }
        position {
          x
          y
        }
        magic
        totalMagic
        hand {
          __typename
          id
          name
          cost
          rarity
          ... on CreatureCardInfo {
            elements
            attack
            hitPoints
            movement
          }
          ... on ItemCardInfo {
            category
            attackBonus
            hitPointsBonus
          }
          ... on SpellCardInfo {
            effect {
              __typename
              ... on SpellDrawCardsEffect {
                count
              }
              ... on SpellGainMagicEffect {
                perLap
              }
              ... on SpellRollDiceEffect {
                count
              }
              ... on SpellFixedDiceCurseEffect {
                value
                turns
              }
            }
          }
        }
        drawPileCount
        discardPile {
          id
          name
        }
        curse {
          remainingTurns
          effect {
            __typename
            ... on MatchFixedDiceCurse {
              value
            }
          }
        }
        turnOrder
        passedCheckpoints {
          x
          y
        }
        rewardReceived
        rewardCards {
          name
        }
      }
      currentParticipant
      awaitingParticipant
    }
  }
}
    `) as unknown as TypedDocumentString<MatchDebugQuery, MatchDebugQueryVariables>;
export const MatchDebugEventsDocument = new TypedDocumentString(`
    query MatchDebugEvents($id: UUID!, $after: Int!) {
  matchEvents(id: $id, after: $after) {
    __typename
    ... on MatchEventList {
      events {
        __typename
        revision
        changes {
          phase
          totalMagics {
            participant
            totalMagic
          }
          territoryValues {
            position {
              x
              y
            }
            value
            toll
          }
        }
        ... on MatchHandsDealtEvent {
          cards
        }
        ... on MatchTurnOrderDecidedEvent {
          order
        }
        ... on MatchCardDrawnEvent {
          participant
          card {
            __typename
            id
            name
            cost
            rarity
            ... on CreatureCardInfo {
              elements
              attack
              hitPoints
              movement
            }
            ... on ItemCardInfo {
              category
              attackBonus
              hitPointsBonus
            }
            ... on SpellCardInfo {
              effect {
                __typename
                ... on SpellDrawCardsEffect {
                  count
                }
                ... on SpellGainMagicEffect {
                  perLap
                }
                ... on SpellRollDiceEffect {
                  count
                }
                ... on SpellFixedDiceCurseEffect {
                  value
                  turns
                }
              }
            }
          }
        }
        ... on MatchSpellUsedEvent {
          participant
          handIndex
          cost
          card {
            __typename
            id
            name
            cost
            rarity
          }
        }
        ... on MatchDiscardPileShuffledEvent {
          participant
          drawPileCount
        }
        ... on MatchHandLimitExceededEvent {
          participant
        }
        ... on MatchCardDiscardedEvent {
          participant
          handIndex
          card {
            __typename
            id
            name
            cost
            rarity
            ... on CreatureCardInfo {
              elements
              attack
              hitPoints
              movement
            }
            ... on ItemCardInfo {
              category
              attackBonus
              hitPointsBonus
            }
            ... on SpellCardInfo {
              effect {
                __typename
                ... on SpellDrawCardsEffect {
                  count
                }
                ... on SpellGainMagicEffect {
                  perLap
                }
                ... on SpellRollDiceEffect {
                  count
                }
                ... on SpellFixedDiceCurseEffect {
                  value
                  turns
                }
              }
            }
          }
        }
        ... on MatchCreatureDeployedEvent {
          participant
          handIndex
          card {
            __typename
            id
            name
            cost
            rarity
            ... on CreatureCardInfo {
              elements
              attack
              hitPoints
              movement
            }
            ... on ItemCardInfo {
              category
              attackBonus
              hitPointsBonus
            }
            ... on SpellCardInfo {
              effect {
                __typename
                ... on SpellDrawCardsEffect {
                  count
                }
                ... on SpellGainMagicEffect {
                  perLap
                }
                ... on SpellRollDiceEffect {
                  count
                }
                ... on SpellFixedDiceCurseEffect {
                  value
                  turns
                }
              }
            }
          }
          creature
          position {
            x
            y
          }
          cost
        }
        ... on MatchTerritoryInvadedEvent {
          participant
          handIndex
          card {
            __typename
            id
            name
            cost
            rarity
            ... on CreatureCardInfo {
              elements
              attack
              hitPoints
              movement
            }
            ... on ItemCardInfo {
              category
              attackBonus
              hitPointsBonus
            }
            ... on SpellCardInfo {
              effect {
                __typename
                ... on SpellDrawCardsEffect {
                  count
                }
                ... on SpellGainMagicEffect {
                  perLap
                }
                ... on SpellRollDiceEffect {
                  count
                }
                ... on SpellFixedDiceCurseEffect {
                  value
                  turns
                }
              }
            }
          }
          position {
            x
            y
          }
          cost
        }
        ... on MatchItemUsedEvent {
          participant
          handIndex
          card {
            __typename
            id
            name
            cost
            rarity
            ... on CreatureCardInfo {
              elements
              attack
              hitPoints
              movement
            }
            ... on ItemCardInfo {
              category
              attackBonus
              hitPointsBonus
            }
            ... on SpellCardInfo {
              effect {
                __typename
                ... on SpellDrawCardsEffect {
                  count
                }
                ... on SpellGainMagicEffect {
                  perLap
                }
                ... on SpellRollDiceEffect {
                  count
                }
                ... on SpellFixedDiceCurseEffect {
                  value
                  turns
                }
              }
            }
          }
          cost
        }
        ... on MatchItemSkippedEvent {
          participant
        }
        ... on MatchBattleStartedEvent {
          attacker {
            attack
            hitPoints
          }
          defender {
            attack
            hitPoints
          }
        }
        ... on MatchBattleStatModifiedEvent {
          side
          attackDelta
          hitPointsDelta
          attack
          hitPoints
          source {
            __typename
            ... on MatchAdjacentTerritoriesSource {
              positions {
                x
                y
              }
            }
            ... on MatchTerrainSource {
              element
              level
            }
            ... on MatchItemSource {
              card {
                id
                name
              }
            }
          }
        }
        ... on MatchCreatureStruckEvent {
          striker
          damage
          remainingHitPoints
        }
        ... on MatchTerritoryConqueredEvent {
          participant
          position {
            x
            y
          }
          defeatedCreature
          creature
          territoryHitPoints
        }
        ... on MatchInvasionRepelledEvent {
          participant
          territoryHitPoints
          returnedTo {
            x
            y
          }
          returnedHitPoints
          position {
            x
            y
          }
          card {
            __typename
            id
            name
            cost
            rarity
            ... on CreatureCardInfo {
              elements
              attack
              hitPoints
              movement
            }
            ... on ItemCardInfo {
              category
              attackBonus
              hitPointsBonus
            }
            ... on SpellCardInfo {
              effect {
                __typename
                ... on SpellDrawCardsEffect {
                  count
                }
                ... on SpellGainMagicEffect {
                  perLap
                }
                ... on SpellRollDiceEffect {
                  count
                }
                ... on SpellFixedDiceCurseEffect {
                  value
                  turns
                }
              }
            }
          }
          returnedToHand
        }
        ... on MatchTollPaidEvent {
          participant
          owner
          position {
            x
            y
          }
          magic
        }
        ... on MatchTerritoryLeveledUpEvent {
          participant
          position {
            x
            y
          }
          level
          magic
        }
        ... on MatchCreatureMovedEvent {
          participant
          from {
            x
            y
          }
          to {
            x
            y
          }
          creature
        }
        ... on MatchTerritoryInvadedByMoveEvent {
          participant
          from {
            x
            y
          }
          position {
            x
            y
          }
          creature
        }
        ... on MatchLandElementChangedEvent {
          participant
          position {
            x
            y
          }
          element
          magic
        }
        ... on MatchCreatureExchangedEvent {
          participant
          position {
            x
            y
          }
          handIndex
          card {
            __typename
            id
            name
            cost
            rarity
            ... on CreatureCardInfo {
              elements
              attack
              hitPoints
              movement
            }
            ... on ItemCardInfo {
              category
              attackBonus
              hitPointsBonus
            }
            ... on SpellCardInfo {
              effect {
                __typename
                ... on SpellDrawCardsEffect {
                  count
                }
                ... on SpellGainMagicEffect {
                  perLap
                }
                ... on SpellRollDiceEffect {
                  count
                }
                ... on SpellFixedDiceCurseEffect {
                  value
                  turns
                }
              }
            }
          }
          creature
          cost
          returnedCard {
            __typename
            id
            name
            cost
            rarity
            ... on CreatureCardInfo {
              elements
              attack
              hitPoints
              movement
            }
            ... on ItemCardInfo {
              category
              attackBonus
              hitPointsBonus
            }
            ... on SpellCardInfo {
              effect {
                __typename
                ... on SpellDrawCardsEffect {
                  count
                }
                ... on SpellGainMagicEffect {
                  perLap
                }
                ... on SpellRollDiceEffect {
                  count
                }
                ... on SpellFixedDiceCurseEffect {
                  value
                  turns
                }
              }
            }
          }
        }
        ... on MatchTerritoryRelinquishedEvent {
          participant
          position {
            x
            y
          }
          creature
          magic
        }
        ... on MatchMagicDepletedEvent {
          participant
          magic
        }
        ... on MatchDiceRolledEvent {
          participant
          value
          dice
          fixedByCurse
        }
        ... on MatchCurseCastEvent {
          participant
          target
          curse {
            remainingTurns
            effect {
              __typename
              ... on MatchFixedDiceCurse {
                value
              }
            }
          }
        }
        ... on MatchCurseRemovedEvent {
          participant
        }
        ... on MatchMagicGainedEvent {
          participant
          magic
        }
        ... on MatchDiceCountChangedEvent {
          participant
          count
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
          ranks
          reason
        }
        ... on MatchRewardDrawnEvent {
          participant
          pack
          rewardCards {
            name
          }
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<MatchDebugEventsQuery, MatchDebugEventsQueryVariables>;
export const DrawMatchCardDocument = new TypedDocumentString(`
    mutation DrawMatchCard($input: DrawMatchCardInput!) {
  drawMatchCard(input: $input) {
    __typename
  }
}
    `) as unknown as TypedDocumentString<DrawMatchCardMutation, DrawMatchCardMutationVariables>;
export const DiscardMatchCardDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<DiscardMatchCardMutation, DiscardMatchCardMutationVariables>;
export const UseMatchSpellDocument = new TypedDocumentString(`
    mutation UseMatchSpell($input: UseMatchSpellInput!) {
  useMatchSpell(input: $input) {
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
    `) as unknown as TypedDocumentString<UseMatchSpellMutation, UseMatchSpellMutationVariables>;
export const DeployMatchCreatureDocument = new TypedDocumentString(`
    mutation DeployMatchCreature($input: DeployMatchCreatureInput!) {
  deployMatchCreature(input: $input) {
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
    `) as unknown as TypedDocumentString<DeployMatchCreatureMutation, DeployMatchCreatureMutationVariables>;
export const RelinquishMatchTerritoryDocument = new TypedDocumentString(`
    mutation RelinquishMatchTerritory($input: RelinquishMatchTerritoryInput!) {
  relinquishMatchTerritory(input: $input) {
    __typename
    ... on ValidationErrors {
      errors {
        __typename
        field
      }
    }
  }
}
    `) as unknown as TypedDocumentString<RelinquishMatchTerritoryMutation, RelinquishMatchTerritoryMutationVariables>;
export const LevelUpMatchTerritoryDocument = new TypedDocumentString(`
    mutation LevelUpMatchTerritory($input: LevelUpMatchTerritoryInput!) {
  levelUpMatchTerritory(input: $input) {
    __typename
    ... on ValidationErrors {
      errors {
        __typename
        field
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LevelUpMatchTerritoryMutation, LevelUpMatchTerritoryMutationVariables>;
export const MoveMatchCreatureDocument = new TypedDocumentString(`
    mutation MoveMatchCreature($input: MoveMatchCreatureInput!) {
  moveMatchCreature(input: $input) {
    __typename
    ... on ValidationErrors {
      errors {
        __typename
        field
      }
    }
  }
}
    `) as unknown as TypedDocumentString<MoveMatchCreatureMutation, MoveMatchCreatureMutationVariables>;
export const ChangeMatchLandElementDocument = new TypedDocumentString(`
    mutation ChangeMatchLandElement($input: ChangeMatchLandElementInput!) {
  changeMatchLandElement(input: $input) {
    __typename
    ... on ValidationErrors {
      errors {
        __typename
        field
      }
    }
  }
}
    `) as unknown as TypedDocumentString<ChangeMatchLandElementMutation, ChangeMatchLandElementMutationVariables>;
export const ExchangeMatchCreatureDocument = new TypedDocumentString(`
    mutation ExchangeMatchCreature($input: ExchangeMatchCreatureInput!) {
  exchangeMatchCreature(input: $input) {
    __typename
    ... on ValidationErrors {
      errors {
        __typename
        field
      }
    }
  }
}
    `) as unknown as TypedDocumentString<ExchangeMatchCreatureMutation, ExchangeMatchCreatureMutationVariables>;
export const RollMatchDiceDocument = new TypedDocumentString(`
    mutation RollMatchDice($input: RollMatchDiceInput!) {
  rollMatchDice(input: $input) {
    __typename
  }
}
    `) as unknown as TypedDocumentString<RollMatchDiceMutation, RollMatchDiceMutationVariables>;
export const ChooseMatchPathDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<ChooseMatchPathMutation, ChooseMatchPathMutationVariables>;
export const EndMatchTurnDocument = new TypedDocumentString(`
    mutation EndMatchTurn($input: EndMatchTurnInput!) {
  endMatchTurn(input: $input) {
    __typename
  }
}
    `) as unknown as TypedDocumentString<EndMatchTurnMutation, EndMatchTurnMutationVariables>;
export const ChooseMatchRewardPackDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<ChooseMatchRewardPackMutation, ChooseMatchRewardPackMutationVariables>;
export const InvadeMatchTerritoryDocument = new TypedDocumentString(`
    mutation InvadeMatchTerritory($input: InvadeMatchTerritoryInput!) {
  invadeMatchTerritory(input: $input) {
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
    `) as unknown as TypedDocumentString<InvadeMatchTerritoryMutation, InvadeMatchTerritoryMutationVariables>;
export const AttackMatchTerritoryDocument = new TypedDocumentString(`
    mutation AttackMatchTerritory($input: AttackMatchTerritoryInput!) {
  attackMatchTerritory(input: $input) {
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
    `) as unknown as TypedDocumentString<AttackMatchTerritoryMutation, AttackMatchTerritoryMutationVariables>;
export const PayMatchTollDocument = new TypedDocumentString(`
    mutation PayMatchToll($input: PayMatchTollInput!) {
  payMatchToll(input: $input) {
    __typename
  }
}
    `) as unknown as TypedDocumentString<PayMatchTollMutation, PayMatchTollMutationVariables>;
export const DefendMatchTerritoryDocument = new TypedDocumentString(`
    mutation DefendMatchTerritory($input: DefendMatchTerritoryInput!) {
  defendMatchTerritory(input: $input) {
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
    `) as unknown as TypedDocumentString<DefendMatchTerritoryMutation, DefendMatchTerritoryMutationVariables>;
export const NpcAvatarDocument = new TypedDocumentString(`
    query NpcAvatar($id: UUID!) {
  npcAvatar(id: $id) {
    __typename
    ... on NpcAvatar {
      id
      name
      decks {
        id
        name
        totalCount
        cards {
          count
          card {
            __typename
            id
            name
            cost
            rarity
          }
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<NpcAvatarQuery, NpcAvatarQueryVariables>;
export const NpcAvatarsDocument = new TypedDocumentString(`
    query NpcAvatars {
  me {
    __typename
    ... on Player {
      npcAvatars {
        id
        name
        decks {
          id
          name
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<NpcAvatarsQuery, NpcAvatarsQueryVariables>;
export const RoomDetailDocument = new TypedDocumentString(`
    query RoomDetail($id: UUID!) {
  room(id: $id) {
    __typename
    ... on Room {
      id
      revision
      name
      status
      match {
        id
      }
      matches {
        id
        number
      }
      capabilities {
        changeSeats
        changeMatchRules
        publish
        declareReady
        declareNext
        resume
        close
        rename
      }
      participants {
        playerId
        owner
        ready
        continues
      }
      seats {
        kind
        playerId
        choiceChangeable
        avatar {
          id
          name
        }
        deck {
          id
          name
        }
      }
      matchRules {
        board {
          id
          name
        }
        targetMagic
        startingMagic
        lapBonus
        checkpointBonus
        roundLimit
        diceMin
        diceMax
        baseLandValue
      }
    }
  }
  me {
    __typename
    ... on Player {
      id
      avatars {
        id
        name
      }
      decks {
        id
        name
      }
      boards {
        id
        name
        defaultRules {
          targetMagic
          startingMagic
          lapBonus
          checkpointBonus
          roundLimit
          diceMin
          diceMax
          baseLandValue
        }
      }
      npcAvatars {
        id
        name
        decks {
          id
          name
        }
      }
    }
  }
  gameRules {
    __typename
    ... on GameRules {
      match {
        minPlayers
        maxPlayers
      }
    }
  }
}
    `) as unknown as TypedDocumentString<RoomDetailQuery, RoomDetailQueryVariables>;
export const CreateRoomDocument = new TypedDocumentString(`
    mutation CreateRoom($input: CreateRoomInput!) {
  createRoom(input: $input) {
    __typename
    ... on CreateRoomSuccess {
      id
      revision
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
    `) as unknown as TypedDocumentString<CreateRoomMutation, CreateRoomMutationVariables>;
export const RenameRoomDocument = new TypedDocumentString(`
    mutation RenameRoom($input: RenameRoomInput!) {
  renameRoom(input: $input) {
    __typename
    ... on RenameRoomSuccess {
      id
      revision
    }
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
    `) as unknown as TypedDocumentString<RenameRoomMutation, RenameRoomMutationVariables>;
export const ChangeRoomSeatsDocument = new TypedDocumentString(`
    mutation ChangeRoomSeats($input: ChangeRoomSeatsInput!) {
  changeRoomSeats(input: $input) {
    __typename
    ... on ChangeRoomSeatsSuccess {
      id
      revision
    }
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
    `) as unknown as TypedDocumentString<ChangeRoomSeatsMutation, ChangeRoomSeatsMutationVariables>;
export const ChangeRoomMatchRulesDocument = new TypedDocumentString(`
    mutation ChangeRoomMatchRules($input: ChangeRoomMatchRulesInput!) {
  changeRoomMatchRules(input: $input) {
    __typename
    ... on ChangeRoomMatchRulesSuccess {
      id
      revision
    }
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
    `) as unknown as TypedDocumentString<ChangeRoomMatchRulesMutation, ChangeRoomMatchRulesMutationVariables>;
export const ChangeRoomSeatChoiceDocument = new TypedDocumentString(`
    mutation ChangeRoomSeatChoice($input: ChangeRoomSeatChoiceInput!) {
  changeRoomSeatChoice(input: $input) {
    __typename
    ... on ChangeRoomSeatChoiceSuccess {
      id
      revision
    }
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
    `) as unknown as TypedDocumentString<ChangeRoomSeatChoiceMutation, ChangeRoomSeatChoiceMutationVariables>;
export const PublishRoomDocument = new TypedDocumentString(`
    mutation PublishRoom($input: PublishRoomInput!) {
  publishRoom(input: $input) {
    __typename
    ... on PublishRoomSuccess {
      id
      revision
    }
  }
}
    `) as unknown as TypedDocumentString<PublishRoomMutation, PublishRoomMutationVariables>;
export const DeclareRoomReadyDocument = new TypedDocumentString(`
    mutation DeclareRoomReady($input: DeclareRoomReadyInput!) {
  declareRoomReady(input: $input) {
    __typename
    ... on DeclareRoomReadySuccess {
      id
      revision
    }
  }
}
    `) as unknown as TypedDocumentString<DeclareRoomReadyMutation, DeclareRoomReadyMutationVariables>;
export const DeclareRoomNextDocument = new TypedDocumentString(`
    mutation DeclareRoomNext($input: DeclareRoomNextInput!) {
  declareRoomNext(input: $input) {
    __typename
    ... on DeclareRoomNextSuccess {
      id
      revision
    }
  }
}
    `) as unknown as TypedDocumentString<DeclareRoomNextMutation, DeclareRoomNextMutationVariables>;
export const ResumeRoomDocument = new TypedDocumentString(`
    mutation ResumeRoom($input: ResumeRoomInput!) {
  resumeRoom(input: $input) {
    __typename
    ... on ResumeRoomSuccess {
      id
      revision
    }
  }
}
    `) as unknown as TypedDocumentString<ResumeRoomMutation, ResumeRoomMutationVariables>;
export const CloseRoomDocument = new TypedDocumentString(`
    mutation CloseRoom($input: CloseRoomInput!) {
  closeRoom(input: $input) {
    __typename
    ... on CloseRoomSuccess {
      id
      revision
    }
  }
}
    `) as unknown as TypedDocumentString<CloseRoomMutation, CloseRoomMutationVariables>;
export const RoomRevisionDocument = new TypedDocumentString(`
    query RoomRevision($id: UUID!) {
  room(id: $id) {
    __typename
    ... on Room {
      revision
    }
  }
}
    `) as unknown as TypedDocumentString<RoomRevisionQuery, RoomRevisionQueryVariables>;
export const RoomMatchDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<RoomMatchQuery, RoomMatchQueryVariables>;
export const MyRoomsDocument = new TypedDocumentString(`
    query MyRooms($after: String) {
  me {
    __typename
    ... on Player {
      roomRequirements
    }
  }
  myRooms(after: $after) {
    __typename
    ... on RoomsConnection {
      edges {
        node {
          id
          name
          status
          seats {
            kind
          }
          matchRules {
            board {
              name
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
    `) as unknown as TypedDocumentString<MyRoomsQuery, MyRoomsQueryVariables>;
export const MeDocument = new TypedDocumentString(`
    query Me {
  me {
    __typename
    ... on Player {
      id
      starterGrant
      avatars {
        id
        name
      }
    }
  }
}
    `) as unknown as TypedDocumentString<MeQuery, MeQueryVariables>;
export const RegisterPlayerDocument = new TypedDocumentString(`
    mutation RegisterPlayer {
  registerPlayer {
    __typename
  }
}
    `) as unknown as TypedDocumentString<RegisterPlayerMutation, RegisterPlayerMutationVariables>;