"use client";

import { useActionState, useState } from "react";
import { RULE_LABELS, type RuleField, ruleStep } from "../../messages";
import { changeMatchRules, type RoomActionState } from "./actions";

type Rules = Record<RuleField, number>;
export type BoardOption = { id: string; name: string; defaultRules: Rules };

const FIELDS = Object.keys(RULE_LABELS) as RuleField[];

export function MatchRulesForm({
  id,
  revision,
  boards,
  current,
}: {
  id: string;
  revision: number;
  boards: BoardOption[];
  // 決めてあるボードと値（まだ決めていなければ null）
  current: ({ boardId: string } & Rules) | null;
}) {
  const [state, formAction, isPending] = useActionState<
    RoomActionState,
    FormData
  >(changeMatchRules, {});
  const [boardId, setBoardId] = useState<string | undefined>(
    current?.boardId ?? boards[0]?.id,
  );
  const [values, setValues] = useState<Rules | undefined>(
    current ?? boards[0]?.defaultRules,
  );

  if (!boardId || !values) {
    return <p>解放したボードがありません</p>;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="revision" value={revision} />
      {state.error && <p role="alert">{state.error}</p>}
      <label>
        ボード
        <select
          name="boardId"
          value={boardId}
          onChange={(event) => {
            setBoardId(event.target.value);
            // 7 つの値は、選んだボードの既定のルールから始める（選び直したら既定に戻す）
            const board = boards.find((b) => b.id === event.target.value);
            if (board) {
              setValues(board.defaultRules);
            }
          }}
        >
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
      </label>
      {FIELDS.map((field) => (
        <label key={field}>
          {RULE_LABELS[field]}
          <input
            name={field}
            type="number"
            step={ruleStep(field)}
            required
            value={values[field]}
            onChange={(event) =>
              setValues({ ...values, [field]: event.target.valueAsNumber })
            }
          />
        </label>
      ))}
      <button type="submit" disabled={isPending}>
        対戦ルールを決める
      </button>
    </form>
  );
}
