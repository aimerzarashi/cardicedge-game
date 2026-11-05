import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSseParser, progressSignal } from "./sse.ts";

describe("createSseParser", () => {
  it("空行で区切られた event と data を 1 件にまとめる", () => {
    const parser = createSseParser();
    assert.deepEqual(parser.push('event: next\ndata: {"a":1}\n\n'), [
      { event: "next", data: '{"a":1}' },
    ]);
  });

  it("チャンクが行の途中で切れても、そろってから 1 件を返す", () => {
    const parser = createSseParser();
    assert.deepEqual(parser.push("event: ne"), []);
    assert.deepEqual(parser.push("xt\ndata: 1"), []);
    assert.deepEqual(parser.push("2\n\nevent: complete\n\n"), [
      { event: "next", data: "12" },
      { event: "complete", data: "" },
    ]);
  });

  it("CRLF が \\r と \\n の間で切れても 1 つの改行として読む", () => {
    const parser = createSseParser();
    assert.deepEqual(parser.push("event: next\r\ndata: x\r"), []);
    assert.deepEqual(parser.push("\n\r\n"), [{ event: "next", data: "x" }]);
  });

  it("複数行の data は改行でつなぎ、コメント行は読み飛ばす", () => {
    const parser = createSseParser();
    assert.deepEqual(parser.push(": ping\nevent: next\ndata: a\ndata: b\n\n"), [
      { event: "next", data: "a\nb" },
    ]);
  });

  it("event が無ければ message として返す", () => {
    const parser = createSseParser();
    assert.deepEqual(parser.push("data: x\n\n"), [
      { event: "message", data: "x" },
    ]);
  });
});

describe("progressSignal", () => {
  it("MatchProgress の next は版を返す", () => {
    const data = JSON.stringify({
      data: { matchProgress: { __typename: "MatchProgress", revision: 7 } },
    });
    assert.deepEqual(progressSignal({ event: "next", data }), {
      kind: "progress",
      revision: 7,
    });
  });

  it("MatchNotFoundError の next と complete は、つなぎ直さない合図にする", () => {
    const data = JSON.stringify({
      data: { matchProgress: { __typename: "MatchNotFoundError" } },
    });
    assert.deepEqual(progressSignal({ event: "next", data }), {
      kind: "closed",
    });
    assert.deepEqual(progressSignal({ event: "complete", data: "" }), {
      kind: "closed",
    });
  });

  it("壊れた data や知らない event は無視する", () => {
    assert.deepEqual(progressSignal({ event: "next", data: "{" }), {
      kind: "ignore",
    });
    assert.deepEqual(progressSignal({ event: "ping", data: "" }), {
      kind: "ignore",
    });
  });
});
