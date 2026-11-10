type Position = { x: number; y: number };

// 止まった後に選んでいる途中のこと。どれを実行するか → どの領地か（領地コマンドだけ）→ 手札・レベル の順に選ぶ。
// 見るための状態なのでイベントにしない
export type StopSelection =
  | { command: "deploy" }
  | { command: "invade" }
  | {
      command: "levelUp" | "exchange" | "elementChange";
      position: Position | null;
    }
  // 移動は、動かす領地 → 行き先 の順に盤面で選ぶ
  | { command: "move"; position: Position | null; to: Position | null };

type TerritoryChoices = {
  levelUpChoices: Position[];
  exchangeChoices: Position[];
  elementChangeChoices: Position[];
  moveChoices: (Position & { to: Position })[];
};

const CHOICES_OF = {
  levelUp: "levelUpChoices",
  exchange: "exchangeChoices",
  elementChange: "elementChangeChoices",
  move: "moveChoices",
} as const;

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

// 領地を選ぶ順番のときに、盤面で押せる領地（core が返した選択肢の位置を、重ねずに返す）
export function selectableTerritories(
  selection: StopSelection | null,
  choices: TerritoryChoices,
): Position[] {
  if (selection === null || !("position" in selection)) {
    return [];
  }
  if (selection.command === "move" && selection.position !== null) {
    // 動かす領地を選んだ後は、その領地から届く行き先
    return selection.to === null
      ? unique(
          choicesAt(choices.moveChoices, selection.position).map(
            (choice) => choice.to,
          ),
        )
      : [];
  }
  if (selection.position !== null) {
    return [];
  }
  return unique(choices[CHOICES_OF[selection.command]]);
}

// 盤面で押したマスを、選んでいる途中のことに当てる（移動は 1 回目が動かす領地、2 回目が行き先）
export function selectTile(
  selection: StopSelection,
  position: Position,
): StopSelection {
  if (!("position" in selection)) {
    return selection;
  }
  if (selection.command === "move" && selection.position !== null) {
    return { ...selection, to: position };
  }
  return { ...selection, position };
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
