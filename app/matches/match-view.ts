import type { Piece } from "../boards/board-layout.ts";

type Participant = {
  turnOrder: number;
  avatar: { name: string };
  position: { x: number; y: number };
};

export function roundText(round: number, roundLimit: number): string {
  return `ラウンド ${round} / ${roundLimit}`;
}

// 順番は core が turnOrder で返す。座席の並びを並べ替えず、表示のために turnOrder の小さい順に並べる
export function turnOrderNames(participants: Participant[]): string[] {
  return [...participants]
    .sort((a, b) => a.turnOrder - b.turnOrder)
    .map((participant) => participant.avatar.name);
}

// currentParticipant は参加者の並び（席の順）の添字で、順番が決まるまでは null
export function currentTurnText(
  participants: Participant[],
  currentParticipant: number | null | undefined,
): string {
  if (currentParticipant === null || currentParticipant === undefined) {
    return "順番はまだ決まっていません";
  }
  return participants[currentParticipant]?.avatar.name ?? "";
}

// 駒の印は席の番号（1 始まり）。同じアバター名の参加者でも区別できる
export function participantPieces(participants: Participant[]): Piece[] {
  return participants.map((participant, index) => ({
    ...participant.position,
    label: String(index + 1),
  }));
}

// 自分の番か。currentParticipant の参加者のプレイヤーが、ログイン中のプレイヤーかどうかだけを見る
export function isMyTurn(
  participants: { playerId?: string | null }[],
  currentParticipant: number | null | undefined,
  playerId: string,
): boolean {
  if (currentParticipant === null || currentParticipant === undefined) {
    return false;
  }
  return participants[currentParticipant]?.playerId === playerId;
}

// winners は participants の何番目か（複数ありうる）。存在しない番号は飛ばす
export function winnerNames(
  participants: { avatar: { name: string } }[],
  winners: number[],
): string {
  return winners
    .flatMap((index) => participants[index]?.avatar.name ?? [])
    .join("、");
}
