import { expect, test } from "./fixtures";
import {
  decideNpcSeat,
  decidePlayerSeat,
  decideRules,
  decideSeats,
  openNewRoom,
} from "./room-flow";

test("対戦の画面の操作だけでラウンドの上限まで進めると、操作が消えて勝った人と理由が出る", async ({
  page,
  request,
}) => {
  await openNewRoom(page, request, "match-ops");
  await decideSeats(page);
  await decideRules(page, 1);
  await decidePlayerSeat(page);
  await decideNpcSeat(page);
  await page.getByRole("button", { name: "公開する" }).click();
  await expect(page.getByTestId("room-status")).toHaveText("準備中");
  await page.getByRole("button", { name: "準備完了" }).click();
  await expect(page).toHaveURL(/\/matches\/[0-9a-f-]{36}$/);

  // 順番は core が決める。NPC が先なら NPC の番は済んでいるので、自分の番の操作が出る
  const outcome = page.getByTestId("match-outcome");
  const draw = page.getByRole("button", { name: "カードを引く" });
  const discard = page.getByRole("button", { name: /を捨てる$/ });
  const roll = page.getByRole("button", { name: "サイコロを振る" });
  const choose = page.getByRole("button", { name: /へ進む$/ });
  const end = page.getByRole("button", { name: "ターンを終える" });
  const operations = draw.or(discard).or(roll).or(choose).or(end);

  // 段階に応じて、出ている操作を 1 つ押す。終わるまで繰り返す（上限 1 ラウンドなので数回で終わる）
  for (let step = 0; step < 30; step++) {
    // NPC の番は core のポリシーが進め、画面は Subscription で進みを受け取って順に描画する（読み直さない。game#40）。
    // 自分の番の操作か結果が出るまで待つ
    await expect(operations.or(outcome).first()).toBeVisible();
    if (await outcome.isVisible()) {
      break;
    }
    const revision = await page.locator("main").getAttribute("data-revision");
    await operations.first().click();
    // 押したあとは画面が読み直されて revision が進む。進む前に次を押すと、古い revision で送ってしまう
    await expect(page.locator("main")).not.toHaveAttribute(
      "data-revision",
      revision ?? "",
    );
  }

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
});
