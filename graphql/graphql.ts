/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
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
export type BoardTileAttribute =
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

/** カードの種類 */
export type CardType =
  | 'CREATURE'
  | 'ITEM'
  | 'SPELL';

/** 対戦ルールを決める入力。7 つの値の名前と決まりは、ボードの既定のルールと同じ */
export type ChangeRoomMatchRulesInput = {
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

/** 部屋を作る入力 */
export type CreateRoomInput = {
  /** 部屋の名前（前後の空白を除いて 1〜20 文字。FieldRequired・FieldTooLong の max。ほかの部屋と同じでもよい） */
  name: string;
};

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
  /** 分かれ道で行き先を選ぶ段階（chooseMatchPath） */
  | 'CHOOSING_PATH'
  /** 手札が上限を超えているので捨てる段階（discardMatchCard） */
  | 'DISCARDING'
  /** カードを引く段階（drawMatchCard） */
  | 'DRAWING'
  /** 対戦が終わった（戦利品のパックを選ぶ段階も、全員が受け取るまでこのまま。chooseMatchRewardPack） */
  | 'ENDED'
  /** ターンを終える段階（endMatchTurn） */
  | 'ENDING'
  /** サイコロを振る段階（rollMatchDice） */
  | 'ROLLING';

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
        | { __typename: 'LandTile', attribute: BoardTileAttribute, x: number, y: number }
        | { __typename: 'ProphecyShopTile', x: number, y: number }
        | { __typename: 'SanctuaryTile', x: number, y: number }
        | { __typename: 'ShrineTile', x: number, y: number }
        | { __typename: 'WarpTile', x: number, y: number }
      >, pairs: Array<{ a: { x: number, y: number }, b: { x: number, y: number } }>, defaultRules: { targetMagic: number, startingMagic: number, lapBonus: number, checkpointBonus: number, roundLimit: number, diceMin: number, diceMax: number } }
    | { __typename: 'BoardNotFoundError' }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type BoardsQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type BoardsQuery = { boards:
    | { __typename: 'BoardsConnection', edges: Array<{ node: { id: string, name: string, width: number, height: number, tileCounts: { land: number, base: number, checkpoint: number, fire: number, earth: number, water: number, wind: number, neutral: number, multi: number, warp: number, bridge: number, sanctuary: number, shrine: number, prophecyShop: number, cardShop: number }, defaultRules: { targetMagic: number, startingMagic: number, lapBonus: number, checkpointBonus: number, roundLimit: number, diceMin: number, diceMax: number } } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } }
    | { __typename: 'PlayerNotRegisteredError' }
    | { __typename: 'ValidationErrors' }
   };

export type PlayerDeckQueryVariables = Exact<{
  id: string;
}>;


export type PlayerDeckQuery = { deck:
    | { __typename: 'Deck', id: string, name: string, totalCount: number, cards: Array<{ count: number, card: { id: string, name: string, type: CardType } }> }
    | { __typename: 'DeckNotFoundError' }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type PlayerDecksQueryVariables = Exact<{ [key: string]: never; }>;


export type PlayerDecksQuery = { me:
    | { __typename: 'Player', decks: Array<{ id: string, name: string, totalCount: number, typeCounts: { creature: number, item: number, spell: number } }> }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type MatchDetailQueryVariables = Exact<{
  id: string;
}>;


export type MatchDetailQuery = { match:
    | { __typename: 'Match', id: string, roomId: string | null, number: number | null, revision: number, round: number, phase: MatchPhase, dice: number | null, remainingSteps: number, currentParticipant: number | null, pathChoices: Array<{ x: number, y: number }>, outcome: { winners: Array<number>, reason: MatchEndReason, ranks: Array<number> } | null, rewardPacks: Array<{ key: string, name: string }>, rules: { targetMagic: number, startingMagic: number, lapBonus: number, checkpointBonus: number, roundLimit: number, diceMin: number, diceMax: number, maxHandCards: number, startingHandCards: number }, board: { width: number, height: number, tiles: Array<
          | { __typename: 'BaseTile', x: number, y: number }
          | { __typename: 'BridgeTile', x: number, y: number }
          | { __typename: 'CardShopTile', x: number, y: number }
          | { __typename: 'CheckpointTile', x: number, y: number }
          | { __typename: 'LandTile', attribute: BoardTileAttribute, x: number, y: number }
          | { __typename: 'ProphecyShopTile', x: number, y: number }
          | { __typename: 'SanctuaryTile', x: number, y: number }
          | { __typename: 'ShrineTile', x: number, y: number }
          | { __typename: 'WarpTile', x: number, y: number }
        >, pairs: Array<{ a: { x: number, y: number }, b: { x: number, y: number } }> }, participants: Array<{ kind: MatchParticipantKind, playerId: string | null, magic: number, drawPileCount: number, turnOrder: number, rewardReceived: boolean, avatar: { id: string, name: string }, position: { x: number, y: number }, hand: Array<{ id: string, name: string }>, passedCheckpoints: Array<{ x: number, y: number }>, rewardCards: Array<{ name: string }> }> }
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

export type MatchEventsQueryVariables = Exact<{
  id: string;
  after: number;
}>;


export type MatchEventsQuery = { matchEvents:
    | { __typename: 'MatchEventList', events: Array<
        | { __typename: 'MatchCardDiscardedEvent', participant: number, revision: number, card: { name: string } }
        | { __typename: 'MatchCardDrawnEvent', participant: number, revision: number, card: { name: string } }
        | { __typename: 'MatchCheckpointPassedEvent', participant: number, magic: number, revision: number, checkpoint: { x: number, y: number } }
        | { __typename: 'MatchCreatedEvent', revision: number }
        | { __typename: 'MatchDecksShuffledEvent', revision: number }
        | { __typename: 'MatchDiceRolledEvent', participant: number, value: number, revision: number }
        | { __typename: 'MatchEndedEvent', winners: Array<number>, reason: MatchEndReason, revision: number }
        | { __typename: 'MatchHandsDealtEvent', cards: number, revision: number }
        | { __typename: 'MatchLapCompletedEvent', participant: number, magic: number, revision: number }
        | { __typename: 'MatchMovedEvent', participant: number, revision: number, to: { x: number, y: number } }
        | { __typename: 'MatchRewardDrawnEvent', participant: number, revision: number, rewardCards: Array<{ name: string }> }
        | { __typename: 'MatchRewardsCompletedEvent', revision: number }
        | { __typename: 'MatchTurnEndedEvent', participant: number, revision: number }
        | { __typename: 'MatchTurnOrderDecidedEvent', order: Array<number>, revision: number }
      > }
    | { __typename: 'MatchNotFoundError' }
    | { __typename: 'PlayerNotRegisteredError' }
   };

export type NpcAvatarQueryVariables = Exact<{
  id: string;
}>;


export type NpcAvatarQuery = { npcAvatar:
    | { __typename: 'NpcAvatar', id: string, name: string, decks: Array<{ id: string, name: string, totalCount: number, cards: Array<{ count: number, card: { id: string, name: string, type: CardType } }> }> }
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
    | { __typename: 'Room', id: string, revision: number, name: string, status: RoomStatus, match: { id: string } | null, matches: Array<{ id: string, number: number }>, capabilities: { changeSeats: boolean, changeMatchRules: boolean, publish: boolean, declareReady: boolean, declareNext: boolean, resume: boolean, close: boolean, rename: boolean } | null, participants: Array<{ playerId: string, owner: boolean, ready: boolean, continues: boolean | null }>, seats: Array<{ kind: RoomSeatKind, playerId: string | null, choiceChangeable: boolean | null, avatar: { id: string, name: string } | null, deck: { id: string, name: string } | null }>, matchRules: { targetMagic: number, startingMagic: number, lapBonus: number, checkpointBonus: number, roundLimit: number, diceMin: number, diceMax: number, board: { id: string, name: string } } | null }
    | { __typename: 'RoomNotFoundError' }
  , me:
    | { __typename: 'Player', id: string, avatars: Array<{ id: string, name: string }>, decks: Array<{ id: string, name: string }>, boards: Array<{ id: string, name: string, defaultRules: { targetMagic: number, startingMagic: number, lapBonus: number, checkpointBonus: number, roundLimit: number, diceMin: number, diceMax: number } }>, npcAvatars: Array<{ id: string, name: string, decks: Array<{ id: string, name: string }> }> }
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
          attribute
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
          id
          name
          type
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
export const MatchDetailDocument = new TypedDocumentString(`
    query MatchDetail($id: UUID!) {
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
        maxHandCards
        startingHandCards
      }
      board {
        width
        height
        tiles {
          __typename
          x
          y
          ... on LandTile {
            attribute
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
          id
          name
        }
        position {
          x
          y
        }
        magic
        hand {
          id
          name
        }
        drawPileCount
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
    }
  }
}
    `) as unknown as TypedDocumentString<MatchDetailQuery, MatchDetailQueryVariables>;
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
export const MatchEventsDocument = new TypedDocumentString(`
    query MatchEvents($id: UUID!, $after: Int!) {
  matchEvents(id: $id, after: $after) {
    __typename
    ... on MatchEventList {
      events {
        __typename
        revision
        ... on MatchHandsDealtEvent {
          cards
        }
        ... on MatchTurnOrderDecidedEvent {
          order
        }
        ... on MatchCardDrawnEvent {
          participant
          card {
            name
          }
        }
        ... on MatchCardDiscardedEvent {
          participant
          card {
            name
          }
        }
        ... on MatchDiceRolledEvent {
          participant
          value
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
          reason
        }
        ... on MatchRewardDrawnEvent {
          participant
          rewardCards {
            name
          }
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<MatchEventsQuery, MatchEventsQueryVariables>;
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
            id
            name
            type
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