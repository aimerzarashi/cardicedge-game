import { expect, test } from "./fixtures";
import {
  decideNpcSeat,
  decidePlayerSeat,
  decideRules,
  decideSeats,
  matchOperations,
  openNewRoom,
} from "./room-flow";

test("デバッグの画面は、再生が追いつくまで操作を出さず、配置まで進めると領地が出て、最後のフレームが開き直した状態と同じになり、部屋からも開ける", async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);
  await openNewRoom(page, request, "match-debug");
  await decideSeats(page);
  // 土地が 6 つ続く 1 本道なので、空いている土地に止まれる
  await decideRules(page, undefined, "公開中D");
  await decidePlayerSeat(page);
  await decideNpcSeat(page);
  await page.getByRole("button", { name: "公開する" }).click();
  await expect(page.getByTestId("room-status")).toHaveText("準備中");
  await page.getByRole("button", { name: "準備完了" }).click();
  await expect(page).toHaveURL(/\/matches\/[0-9a-f-]{36}\/debug$/);
  await expect(page.getByTestId("match-frame")).toBeVisible();
  // フレームが変わるたびに、版と領地の数を記録する
  await page.evaluate(() => {
    const target = document.querySelector("[data-testid='match-frame']");
    if (!(target instanceof HTMLElement)) return;
    const territories = () =>
      target.querySelectorAll("[data-testid='match-territories'] li").length;
    const recorded = [
      { revision: Number(target.dataset.revision), territories: territories() },
    ];
    Object.assign(window, { recordedFrames: recorded });
    new MutationObserver(() => {
      recorded.push({
        revision: Number(target.dataset.revision),
        territories: territories(),
      });
    }).observe(target, {
      attributes: true,
      attributeFilter: ["data-revision"],
    });
  });

  const frame = page.getByTestId("match-frame");
  const replaying = page.getByTestId("match-replaying");
  const deploy = page.getByRole("button", { name: /を配置する$/ });
  const operations = matchOperations(page);
  for (let step = 0; step < 40; step++) {
    await expect(deploy.or(operations).first()).toBeVisible({
      timeout: 20_000,
    });
    if (await deploy.first().isVisible()) {
      break;
    }
    const revision = await frame.getAttribute("data-revision");
    await operations.first().click();
    await expect(frame).not.toHaveAttribute("data-revision", revision ?? "");
  }
  // 操作が出ているのは再生が追いついた後なので、段階もコマの位置もその版のものになっている
  await expect(replaying).toBeHidden();
  await expect(page.getByTestId("match-phase")).toContainText("配置");

  const label = (await deploy.first().textContent()) ?? "";
  const creature = label.replace(/を配置する$/, "");
  await deploy.first().click();

  await expect(page.getByTestId("match-territories")).toContainText(
    new RegExp(`${creature}.*レベル 1.*価値 100.*通行料 60`),
    { timeout: 20_000 },
  );
  await expect(
    page.getByTestId("match-events").locator("li").first(),
  ).toBeVisible();

  // NPC の番まで再生が済み、自分の操作を待っている状態で比べる（ここからは対戦が進まない）
  await expect(page.getByText("あなたの番です")).toBeVisible({
    timeout: 20_000,
  });
  await expect(replaying).toBeHidden();

  // イベントを 1 つずつ描き、領地が増えるのは配置のイベントの版だけ
  const frames = await page.evaluate(
    () =>
      (
        window as unknown as {
          recordedFrames: { revision: number; territories: number }[];
        }
      ).recordedFrames,
  );
  const lines = await page
    .getByTestId("match-events")
    .locator("li")
    .allTextContents();
  const deployed = new Set(
    lines.flatMap((line) => {
      const found = line.match(/(\d+).*を .*に配置した/);
      return found ? [Number(found[1])] : [];
    }),
  );
  expect(deployed.size).toBeGreaterThan(0);
  for (let i = 1; i < frames.length; i++) {
    expect(frames[i].revision).toBe(frames[i - 1].revision + 1);
    const grew = frames[i].territories > frames[i - 1].territories;
    expect(grew).toBe(deployed.has(frames[i].revision));
  }

  const replayed = await frame.textContent();
  await page.reload();
  await expect(frame).toHaveText(replayed ?? "");

  // 部屋の「対戦の画面へ」からも、同じ画面へ戻れる
  const debugUrl = page.url();
  await page.getByRole("link", { name: "部屋に戻る" }).click();
  await expect(page).toHaveURL(/\/rooms\/[0-9a-f-]{36}$/);
  await page.getByRole("link", { name: "対戦の画面へ" }).click();
  await expect(page).toHaveURL(debugUrl);
});
