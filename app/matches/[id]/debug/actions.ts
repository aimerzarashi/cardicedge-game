"use server";

import { callCore } from "@/lib/core";
import type { PlayEvent } from "./match-frame";
import { matchDebugEventsQuery } from "./operations";

export type MatchDebugEventsResult =
  | { ok: true; events: PlayEvent[] }
  | { ok: false };

export async function loadMatchDebugEvents(
  id: string,
  after: number,
): Promise<MatchDebugEventsResult> {
  if (typeof id !== "string" || !Number.isInteger(after) || after < 0) {
    return { ok: false };
  }
  const result = await callCore(matchDebugEventsQuery, { id, after });
  if (!result.ok || result.data.matchEvents.__typename !== "MatchEventList") {
    return { ok: false };
  }
  return { ok: true, events: result.data.matchEvents.events };
}
