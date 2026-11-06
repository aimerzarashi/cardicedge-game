import { expect, test } from "./fixtures";
import {
  decideNpcSeat,
  decidePlayerSeat,
  decideRules,
  decideSeats,
  matchOperations,
  openNewRoom,
  playMatchToEnd,
} from "./room-flow";

test("対戦の画面の操作だけでラウンドの上限まで進めると、操作が消えて勝った人と理由が出て、戦利品を受け取ったあと部屋で続けて 2 戦目を遊び、終えると休止中で一覧に残り、開いて再開すると準備中に戻る", async ({
  page,
  request,
}) => {
  // 2 戦を最後まで進めるため、既定の 30 秒では足りない
  test.setTimeout(90_000);
  await openNewRoom(page, request, "match-ops");
  await decideSeats(page);
  await decideRules(page, 1);
  await decidePlayerSeat(page);
  await decideNpcSeat(page);
  await page.getByRole("button", { name: "公開する" }).click();
  await expect(page.getByTestId("room-status")).toHaveText("準備中");
  await page.getByRole("button", { name: "準備完了" }).click();
  await expect(page).toHaveURL(/\/matches\/[0-9a-f-]{36}$/);

  await expect(page.getByTestId("match-number")).toHaveText("1 戦目");
  // 順番は core が決める。NPC が先なら NPC の番は済んでいるので、自分の番の操作が出る
  const outcome = page.getByTestId("match-outcome");
  const operations = matchOperations(page);
  await playMatchToEnd(page);

  await expect(outcome).toBeVisible();
  await expect(page.getByTestId("match-phase")).toHaveText(
    "対戦は終わりました",
  );
  await expect(page.getByTestId("match-winners")).toHaveText(/部屋用|炎の剣士/);
  await expect(outcome).toContainText("ラウンドの上限に達した");
  await expect(operations).toHaveCount(0);

  // 振り返り: 順位は core が決めたものをそのまま出す。受け取る前は戦利品のパックを選べる
  const ranks = page.getByTestId("review-rank");
  await expect(ranks).toHaveCount(2);
  await expect(ranks.first()).toHaveText("1 位");
  await expect(page.getByTestId("match-rounds")).toHaveText("ラウンドの数: 1");
  await expect(page.getByRole("link", { name: "部屋に戻る" })).toBeVisible();

  // パックを選ぶと、引いたカード（テスト用のマスタの公開中のカード）が出て、選ぶボタンが消える
  const packButton = page.getByRole("button", { name: /を選ぶ$/ });
  await packButton.click();
  await expect(page.getByTestId("review-reward-cards")).toHaveText(
    /戦利品: (A|B|C)(、(A|B|C))*$/,
  );
  await expect(packButton).toHaveCount(0);
  await expect(
    page
      .getByTestId("match-events")
      .getByRole("listitem")
      .filter({ hasText: /戦利品を引いた（/ }),
    // 描画は 1 イベントずつ間を置くため、対戦の最初からのイベントを見せ終えるのを待つ
  ).toHaveCount(1, { timeout: 20_000 });

  // NPC（炎の剣士）の番が描画され、欄に版の番号・誰が・何をしたかが出る
  const events = page.getByTestId("match-events").getByRole("listitem");
  await expect(
    events.filter({ hasText: /^版 \d+ 炎の剣士: サイコロ \d/ }).first(),
  ).toBeVisible();
  await expect(
    events
      .filter({ hasText: /^版 \d+ 炎の剣士: \(\d+, \d+\) へ進んだ/ })
      .first(),
  ).toBeVisible();
  await expect(events.filter({ hasText: /対戦が終わった/ })).toHaveCount(1);

  // 部屋に戻ると、全員が戦利品を受け取ったので次を決める状態になる（投影の遅れの間は出し直して待つ）
  const backToRoom = page.getByRole("link", { name: "部屋に戻る" });
  await expect(backToRoom).toHaveAttribute("href", /\/rooms\/[0-9a-f-]{36}$/);
  await backToRoom.click();
  await expect(page).toHaveURL(/\/rooms\/[0-9a-f-]{36}$/);
  const status = page.getByTestId("room-status");
  await expect(async () => {
    await page.reload();
    await expect(status).toHaveText("次を決める", { timeout: 1000 });
  }).toPass();
  const continues = page.getByTestId("participant-continues");
  await expect(continues).toHaveText(["まだ"]);
  await expect(
    page.getByTestId("room-matches").getByRole("listitem"),
  ).toHaveText(["1 戦目"]);

  // 続けると準備中に戻り、条件を変え直して準備完了にすると 2 戦目が始まる
  await page.getByRole("button", { name: "続ける" }).click();
  await expect(status).toHaveText("準備中");
  await expect(page.getByRole("button", { name: "続ける" })).toHaveCount(0);
  await page.getByLabel("目標の魔力").fill("9500");
  await page.getByRole("button", { name: "対戦ルールを決める" }).click();
  await expect(page.getByTestId("match-rules")).toContainText(
    "目標の魔力 9500",
  );
  await page.getByRole("button", { name: "準備完了" }).click();
  await expect(page).toHaveURL(/\/matches\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("match-number")).toHaveText("2 戦目");
  await playMatchToEnd(page);
  await page.getByRole("button", { name: /を選ぶ$/ }).click();
  await expect(page.getByTestId("review-reward-cards")).toBeVisible();

  // 2 戦目のあとに終えると、部屋は閉じずに休止中になる。この部屋の対戦には 2 戦が始めた順に並ぶ
  await expect(backToRoom).toHaveAttribute("href", /\/rooms\/[0-9a-f-]{36}$/);
  await backToRoom.click();
  // 移る前に読み直すと、移動が取り消されて対戦の画面を読み直し続けるため、部屋の画面に移るのを待つ
  await expect(page).toHaveURL(/\/rooms\/[0-9a-f-]{36}$/);
  await expect(async () => {
    await page.reload();
    await expect(status).toHaveText("次を決める", { timeout: 1000 });
  }).toPass();
  await expect(
    page.getByTestId("room-matches").getByRole("listitem"),
  ).toHaveText(["1 戦目", "2 戦目"]);
  await page.getByRole("button", { name: "終える" }).click();
  await expect(status).toHaveText("休止中");
  await expect(page.getByRole("button", { name: "続ける" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "部屋を閉じる" }),
  ).toBeVisible();

  // 休止中の部屋は一覧に残り、開いて再開すると準備中に戻る
  const roomUrl = page.url();
  await page.goto("/rooms");
  const listed = page.getByRole("link", { name: "確認用の部屋" });
  await expect(listed).toHaveAttribute("href", new URL(roomUrl).pathname);
  await listed.click();
  await expect(status).toHaveText("休止中");
  await page.getByRole("button", { name: "再開する" }).click();
  await expect(status).toHaveText("準備中");
  await expect(page.getByRole("button", { name: "再開する" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "準備完了" })).toBeVisible();
});
