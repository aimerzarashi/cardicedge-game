import { expect, test } from "./fixtures";
import {
  decideNpcSeat,
  decidePlayerSeat,
  decideRules,
  decideSeats,
  matchOperations,
  openNewRoom,
  reloadUntilVisible,
  seatItem,
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
  const chooseDeploy = page.getByRole("button", { name: "配置", exact: true });
  const deploy = page.getByRole("button", { name: /を配置する$/ });
  const operations = matchOperations(page);
  for (let step = 0; step < 40; step++) {
    await expect(chooseDeploy.or(operations).first()).toBeVisible({
      timeout: 20_000,
    });
    if (await chooseDeploy.isVisible()) {
      break;
    }
    const revision = await frame.getAttribute("data-revision");
    await operations.first().click();
    await expect(frame).not.toHaveAttribute("data-revision", revision ?? "");
  }
  // 操作が出ているのは再生が追いついた後なので、段階もコマの位置もその版のものになっている
  await expect(replaying).toBeHidden();
  await expect(page.getByTestId("match-phase")).toContainText("配置");

  await chooseDeploy.click();
  await expect(deploy.first()).toBeVisible();
  const label = (await deploy.first().textContent()) ?? "";
  const creature = label.replace(/を配置する$/, "");
  await deploy.first().click();

  await expect(page.getByTestId("match-territories")).toContainText(
    new RegExp(`${creature}.*レベル 1.*価値 100.*通行料 60`),
    { timeout: 20_000 },
  );
  // マスの表示は、ボタンで通行料と AT・HP を切り替える
  await page.getByRole("button", { name: "AT・HP を表示" }).click();
  await expect(page.getByTestId("territory-stats").first()).toHaveText(
    /^⚔\d+ ♡\d+$/,
  );
  await expect(page.getByTestId("territory-toll")).toHaveCount(0);
  await page.getByRole("button", { name: "通行料を表示" }).click();
  await expect(page.getByTestId("territory-toll").first()).toBeVisible();
  await expect(page.getByTestId("territory-stats")).toHaveCount(0);
  // T のキーでも切り替わる
  await page.keyboard.press("t");
  await expect(page.getByTestId("territory-stats").first()).toBeVisible();
  await page.keyboard.press("t");
  await expect(page.getByTestId("territory-toll").first()).toBeVisible();
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

test("他人の領地に止まると通行料か侵略かを選べ、侵略すると戦闘の結果まで順に描かれる", async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  await openNewRoom(page, request, "match-invade");
  await decideSeats(page);
  // 土地が 6 つ続く 1 本道なので、NPC の領地に止まれる
  await decideRules(page, undefined, "公開中D");
  await decidePlayerSeat(page);
  await decideNpcSeat(page);
  await page.getByRole("button", { name: "公開する" }).click();
  await expect(page.getByTestId("room-status")).toHaveText("準備中");
  await page.getByRole("button", { name: "準備完了" }).click();
  await expect(page).toHaveURL(/\/matches\/[0-9a-f-]{36}\/debug$/);

  const frame = page.getByTestId("match-frame");
  const chooseInvade = page.getByRole("button", { name: "侵略", exact: true });
  const invade = page.getByRole("button", { name: /で侵略する$/ });
  const endTurn = page.getByRole("button", { name: "ターンを終える" });
  const operations = matchOperations(page);
  // 自分の領地を作らないので、NPC に侵略されず、止まるのは NPC の領地だけになる
  for (let step = 0; step < 150; step++) {
    await expect(chooseInvade.or(operations).first()).toBeVisible({
      timeout: 20_000,
    });
    if (await chooseInvade.isVisible()) {
      break;
    }
    const button = (await endTurn.isVisible()) ? endTurn : operations.first();
    const revision = await frame.getAttribute("data-revision");
    await button.click();
    await expect(frame).not.toHaveAttribute("data-revision", revision ?? "");
  }
  await expect(page.getByTestId("match-phase")).toContainText("侵略");
  await expect(
    page.getByRole("button", { name: "通行料を払う" }),
  ).toBeVisible();

  await chooseInvade.click();
  await invade.first().click();
  // 選んだ時点で確定するので、次はアイテムの選びだけが出て、通行料は払えない
  const noItem = page.getByRole("button", { name: "アイテムを出さずに攻める" });
  await expect(noItem).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("match-phase")).toContainText("攻める側");
  await expect(page.getByTestId("match-invasion")).toBeVisible();
  await expect(page.getByRole("button", { name: "通行料を払う" })).toBeHidden();
  await noItem.click();

  // NPC は守る操作をすぐ行い、戦闘の結果まで描かれる
  const events = page.getByTestId("match-events");
  await expect(events).toContainText("を侵略した", { timeout: 20_000 });
  await expect(events).toContainText("戦闘が始まった");
  await expect(events).toContainText("攻める側の攻撃");
  await expect(events).toContainText(/を奪った|侵略に失敗した/);
  await expect(page.getByTestId("match-invasion")).toBeHidden();
});

test("振る前に手札のスペルを使うと、コストを払ってカードを引き、そのターンはもう使えない", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  await openNewRoom(page, request, "match-spell");
  await decideSeats(page);
  await decideRules(page);
  // 水のデッキに、カードを 1 枚引くスペル E（コスト 10）が 1 枚入っている（local/core-master/master.sql）
  await reloadUntilVisible(page, seatItem(page, 0).getByLabel("デッキ"));
  await seatItem(page, 0).getByLabel("デッキ").selectOption({ label: "水" });
  await seatItem(page, 0)
    .getByRole("button", { name: "席 1 を決める" })
    .click();
  await expect(seatItem(page, 0)).toContainText("デッキ: 水");
  await decideNpcSeat(page);
  await page.getByRole("button", { name: "公開する" }).click();
  await expect(page.getByTestId("room-status")).toHaveText("準備中");
  await page.getByRole("button", { name: "準備完了" }).click();
  await expect(page).toHaveURL(/\/matches\/[0-9a-f-]{36}\/debug$/);

  const frame = page.getByTestId("match-frame");
  const useSpell = page.getByRole("button", { name: "Eを使う" });
  const operations = matchOperations(page);
  // デッキは 7 枚なので、2 ターン目までに E が手札に来る
  for (let step = 0; step < 40; step++) {
    await expect(useSpell.or(operations).first()).toBeVisible({
      timeout: 20_000,
    });
    if (await useSpell.isVisible()) {
      break;
    }
    const revision = await frame.getAttribute("data-revision");
    await operations.first().click();
    await expect(frame).not.toHaveAttribute("data-revision", revision ?? "");
  }
  await expect(page.getByTestId("match-phase")).toContainText("サイコロを振る");

  const revision = await frame.getAttribute("data-revision");
  await useSpell.click();
  await expect(frame).not.toHaveAttribute("data-revision", revision ?? "");

  const events = page.getByTestId("match-events");
  await expect(events).toContainText("スペル「E」を使った（魔力 -10）");
  // 続けて 1 枚引き、振る段階のまま。スペルは 1 ターンに 1 枚までなので、使うボタンは消える
  await expect(events.getByRole("listitem").first()).toContainText("を引いた");
  await expect(
    page.getByRole("button", { name: "サイコロを振る" }),
  ).toBeVisible();
  await expect(useSpell).toHaveCount(0);
});
