type Position = { x: number; y: number };

// 止まった後に選んでいる途中のこと。どれを実行するか → どの領地か（領地コマンドだけ）→ 手札・レベル の順に選ぶ。
// 見るための状態なのでイベントにしない
export type StopSelection =
  | { command: "deploy" }
  | { command: "invade" }
  | {
      command: "levelUp" | "exchange" | "elementChange";
      position: Position | null;
    };

type TerritoryChoices = {
  levelUpChoices: Position[];
  exchangeChoices: Position[];
  elementChangeChoices: Position[];
};

const CHOICES_OF = {
  levelUp: "levelUpChoices",
  exchange: "exchangeChoices",
  elementChange: "elementChangeChoices",
} as const;

// 領地を選ぶ順番のときに、盤面で押せる領地（core が返した選択肢の位置を、重ねずに返す）
export function selectableTerritories(
  selection: StopSelection | null,
  choices: TerritoryChoices,
): Position[] {
  if (
    selection === null ||
    !("position" in selection) ||
    selection.position !== null
  ) {
    return [];
  }
  const candidates = choices[CHOICES_OF[selection.command]];
  return candidates.filter(
    (position, index) =>
      candidates.findIndex(
        (other) => other.x === position.x && other.y === position.y,
      ) === index,
  );
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
