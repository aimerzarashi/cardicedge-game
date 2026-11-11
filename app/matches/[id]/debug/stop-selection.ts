type Position = { x: number; y: number };

// 領地コマンドの種類（どれを使えるかは core が領地ごとに返す）
export type TerritoryCommand =
  | "levelUp"
  | "exchange"
  | "elementChange"
  | "move";

// 止まった後に選んでいる途中のこと。何をするか → 領地コマンドなら盤面で領地 → その領地で使える領地コマンド → 手札・レベル・属性・行き先
// の順に選ぶ（game#76。領地コマンドは領地しだいで使えるものが違うため、領地を先に選ぶ。2026-11-10 オーナー）。
// 振る前のスペルも、クリーチャーを対象にするものは同じく盤面で領地を選ぶので、ここに入れる（2026-11-11 オーナー）。
// 見るための状態なのでイベントにしない
export type StopSelection =
  | { command: "deploy" }
  | { command: "invade" }
  | {
      command: "territory";
      position: Position | null;
      action: TerritoryCommand | null;
      // 移動の行き先（移動だけ。動かす領地の次に盤面で選ぶ）
      to: Position | null;
    }
  // スペルは、手札のどれか → 対象（プレイヤーはボタン、クリーチャーは盤面の領地）の順に選ぶ
  | { command: "spell"; handIndex: number; position: Position | null };

type TerritoryChoices = {
  levelUpChoices: Position[];
  exchangeChoices: Position[];
  elementChangeChoices: Position[];
  moveChoices: (Position & { to: Position })[];
};

type Choices = TerritoryChoices & {
  spellChoices: { handIndex: number; targetPositions: Position[] }[];
};

const CHOICES_OF = {
  levelUp: "levelUpChoices",
  exchange: "exchangeChoices",
  elementChange: "elementChangeChoices",
  move: "moveChoices",
} as const;

// 1 つの領地で並べる順（1 段目の並びだった順のまま）
const TERRITORY_COMMANDS: TerritoryCommand[] = [
  "levelUp",
  "exchange",
  "elementChange",
  "move",
];

// 位置だけにして重ねない（移動の選択肢は行き先も持つので、位置だけを取り出す）
function unique(candidates: Position[]): Position[] {
  const positions = candidates.map(({ x, y }) => ({ x, y }));
  return positions.filter(
    (position, index) =>
      positions.findIndex(
        (other) => other.x === position.x && other.y === position.y,
      ) === index,
  );
}

// 領地コマンドを 1 つでも使える領地（core が返した選択肢の位置を、重ねずに返す）
export function territoryCommandPositions(
  choices: TerritoryChoices,
): Position[] {
  return unique(
    TERRITORY_COMMANDS.flatMap((command) => choices[CHOICES_OF[command]]),
  );
}

// 選んだ領地で使える領地コマンド（core がその領地の選択肢を返したものだけ）
export function territoryCommandsAt(
  choices: TerritoryChoices,
  position: Position,
): TerritoryCommand[] {
  return TERRITORY_COMMANDS.filter(
    (command) => choicesAt(choices[CHOICES_OF[command]], position).length > 0,
  );
}

// 盤面で押せる領地。領地を選ぶ順番のときは使える領地、移動の行き先を選ぶ順番のときはその領地から届く行き先
export function selectableTerritories(
  selection: StopSelection | null,
  choices: Choices,
): Position[] {
  if (selection === null) {
    return [];
  }
  if (selection.command === "spell") {
    const { handIndex } = selection;
    // 対象を押した後も印を残し、別の対象を押して選び直せる（2026-11-11 オーナー）
    return unique(
      choices.spellChoices.find((choice) => choice.handIndex === handIndex)
        ?.targetPositions ?? [],
    );
  }
  if (selection.command !== "territory") {
    return [];
  }
  if (selection.action === "move" && selection.position !== null) {
    return selection.to === null
      ? unique(
          choicesAt(choices.moveChoices, selection.position).map(
            (choice) => choice.to,
          ),
        )
      : [];
  }
  // 領地コマンドを選んでいる間は、領地を選んだ後も印を残し、別の領地を押して選び直せる（2026-11-11 オーナー）
  return territoryCommandPositions(choices);
}

// 選んでいる間、盤面に見るだけの印を付けるマス。配置・侵略は手札を選んでいる間も止まったマスに印を残す（2026-11-11 オーナー）。
// 移動の行き先を選ぶ段では、行き先の押せる印と見分けられるよう、使える領地を見るだけの印にする
export function previewedTiles(
  selection: StopSelection | null,
  choices: TerritoryChoices,
  stopped: Position,
): Position[] {
  if (selection?.command === "deploy" || selection?.command === "invade") {
    return [stopped];
  }
  return selection?.command === "territory" &&
    selection.position !== null &&
    selection.action === "move"
    ? territoryCommandPositions(choices)
    : [];
}

// 盤面で押したマスを、選んでいる途中のことに当てる（領地コマンドは押した領地を選び直し、移動を選んだ後は行き先にする）
export function selectTile(
  selection: StopSelection,
  position: Position,
): StopSelection {
  if (selection.command === "spell") {
    return { ...selection, position };
  }
  if (selection.command !== "territory") {
    return selection;
  }
  if (selection.action === "move" && selection.position !== null) {
    return { ...selection, to: position };
  }
  // 別の領地を押したら、その領地で使える領地コマンドを選び直す
  return { command: "territory", position, action: null, to: null };
}

// 選んだ領地の選択肢だけに絞る（手札・レベルを選ぶ順番で並べる）
export function choicesAt<T extends Position>(
  choices: T[],
  position: Position,
): T[] {
  return choices.filter(
    (choice) => choice.x === position.x && choice.y === position.y,
  );
}
