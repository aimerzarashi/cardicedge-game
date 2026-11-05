export type SseMessage = { event: string; data: string };

// fetch のストリームを読んで SSE をほどく。チャンクの切れ目は行の途中でも、改行の途中（\r と \n の間）でも来る。
// graphql-sse などのパッケージは、標準で足りるため足さない
export function createSseParser() {
  let buffer = "";
  let event = "";
  let data: string[] = [];

  return {
    push(chunk: string): SseMessage[] {
      buffer += chunk;
      const messages: SseMessage[] = [];
      for (;;) {
        const terminator = /\r\n|\n|\r/.exec(buffer);
        if (!terminator) break;
        // 末尾の \r は、次のチャンクの \n と続いて 1 つの改行かもしれないので待つ
        if (terminator[0] === "\r" && terminator.index + 1 === buffer.length) {
          break;
        }
        const line = buffer.slice(0, terminator.index);
        buffer = buffer.slice(terminator.index + terminator[0].length);

        if (line === "") {
          if (event !== "" || data.length > 0) {
            messages.push({ event: event || "message", data: data.join("\n") });
          }
          event = "";
          data = [];
          continue;
        }
        if (line.startsWith(":")) continue;
        const colon = line.indexOf(":");
        const field = colon < 0 ? line : line.slice(0, colon);
        const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
        if (field === "event") event = value;
        if (field === "data") data.push(value);
      }
      return messages;
    },
  };
}

export type ProgressSignal =
  | { kind: "progress"; revision: number }
  // 対戦が終わった・無い・参加していない。つなぎ直さない
  | { kind: "closed" }
  | { kind: "ignore" };

// matchProgress の 1 件を読む。core の complete は閉じる合図で、つなぎ直さない
export function progressSignal(message: SseMessage): ProgressSignal {
  if (message.event === "complete") return { kind: "closed" };
  if (message.event !== "next") return { kind: "ignore" };
  try {
    const body = JSON.parse(message.data) as {
      data?: { matchProgress?: { __typename?: string; revision?: number } };
    };
    const progress = body.data?.matchProgress;
    if (progress?.__typename === "MatchProgress") {
      return typeof progress.revision === "number"
        ? { kind: "progress", revision: progress.revision }
        : { kind: "ignore" };
    }
    return progress ? { kind: "closed" } : { kind: "ignore" };
  } catch {
    return { kind: "ignore" };
  }
}
