import type { Piece } from "../boards/board-layout.ts";

type Participant = {
  turnOrder: number;
  avatar: { name: string };
  position: { x: number; y: number };
};

export function roundText(round: number, roundLimit: number): string {
  return `ラウンド ${round} / ${roundLimit}`;
}

export type ParticipantRow = {
  seat: number;
  piece: number;
  isCurrent: boolean;
};

// 順番は core が turnOrder で返す。席の並びは変えず、表示のために turnOrder の小さい順に並べる。
// 並べ替えると盤面のコマの番号（席の添字 + 1）とずれるため、行ごとにコマの番号を持たせる
export function participantRows(
  participants: Participant[],
  currentParticipant: number | null | undefined,
): ParticipantRow[] {
  return participants
    .map((participant, seat) => ({ participant, seat }))
    .sort((a, b) => a.participant.turnOrder - b.participant.turnOrder)
    .map(({ seat }) => ({
      seat,
      piece: seat + 1,
      isCurrent: seat === currentParticipant,
    }));
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

export type ReviewRow = {
  seat: number;
  rank: number;
  name: string;
  isPlayer: boolean;
  magic: number;
  rewardReceived: boolean;
  rewardCards: string[];
};

// 順位は core が ranks（席の順）で返す。画面は決めず、その値の小さい順（同じ順位は席の順）に並べるだけ
export function reviewRows(
  participants: {
    kind: string;
    avatar: { name: string };
    magic: number;
    rewardReceived: boolean;
    rewardCards: { name: string }[];
  }[],
  ranks: number[],
): ReviewRow[] {
  return participants
    .map((participant, seat) => ({
      seat,
      rank: ranks[seat] ?? 0,
      name: participant.avatar.name,
      isPlayer: participant.kind === "PLAYER",
      magic: participant.magic,
      rewardReceived: participant.rewardReceived,
      rewardCards: participant.rewardCards.map((card) => card.name),
    }))
    .sort((a, b) => a.rank - b.rank || a.seat - b.seat);
}
