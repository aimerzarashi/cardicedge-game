import type { APIRequestContext, Locator, Page } from "@playwright/test";
import { login, signUpAndVerify } from "./account";
import { expect } from "./fixtures";

// 新しくサインアップしたプレイヤー（アバターを 1 体作る）で部屋を作り、詳細を開く。
// 部屋は作った人にしか見えないが、数が絡む一覧の確認のため、テストごとに新しいプレイヤーを使う
export async function openNewRoom(
  page: Page,
  request: APIRequestContext,
  prefix: string,
) {
  const email = `${prefix}-${Date.now()}@example.com`;
  await signUpAndVerify(page, request, email, "player-password");
  await login(page, email, "player-password");
  await expect(page.getByTestId("player-email")).toHaveText(email);
  await page.getByRole("link", { name: "アバター" }).click();
  await page.getByLabel("名前").fill("部屋用");
  await page.getByRole("button", { name: "作る" }).click();
  await expect(page.getByTestId("avatars").getByRole("listitem")).toHaveText([
    "部屋用",
  ]);
  await page.goto("/rooms");
  await page.getByLabel("部屋の名前").fill("確認用の部屋");
  await page.getByRole("button", { name: "部屋を作る" }).click();
  await expect(page).toHaveURL(/\/rooms\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("room-name")).toHaveText("確認用の部屋");
  await expect(page.getByTestId("room-status")).toHaveText("公開前");
}

// 解放したボード・配られたデッキは、core の投影が追いつくまで選べない。選べるまで再読み込みして待つ
export async function reloadUntilVisible(page: Page, target: Locator) {
  await expect(async () => {
    await page.reload();
    await expect(target).toBeVisible({ timeout: 1000 });
  }).toPass();
}

export function seatItem(page: Page, index: number) {
  return page.getByTestId("seats").getByRole("listitem").nth(index);
}

export async function decideSeats(page: Page) {
  await page.getByLabel("席の数").selectOption("2");
  await page.getByRole("button", { name: "席を決める" }).click();
  await expect(page.getByTestId("seats").getByRole("listitem")).toHaveCount(2);
  await expect(seatItem(page, 0)).toContainText("プレイヤー");
  await expect(seatItem(page, 1)).toContainText("NPC");
}

export async function decideRules(page: Page, roundLimit?: number) {
  await reloadUntilVisible(page, page.getByLabel("ボード"));
  await page.getByLabel("ボード").selectOption({ label: "公開中A" });
  // 7 つの値は、選んだボードの既定のルールから始まる
  await expect(page.getByLabel("目標の魔力")).toHaveValue("8000");
  await page.getByLabel("目標の魔力").fill("9000");
  if (roundLimit !== undefined) {
    await page.getByLabel("ラウンドの上限").fill(String(roundLimit));
  }
  await page.getByRole("button", { name: "対戦ルールを決める" }).click();
  await expect(page.getByTestId("match-rules")).toContainText("公開中A");
  await expect(page.getByTestId("match-rules")).toContainText(
    "目標の魔力 9000",
  );
}

export async function decidePlayerSeat(page: Page) {
  await reloadUntilVisible(page, seatItem(page, 0).getByLabel("デッキ"));
  await seatItem(page, 0)
    .getByRole("button", { name: "席 1 を決める" })
    .click();
  await expect(seatItem(page, 0)).toContainText("アバター: 部屋用");
  await expect(seatItem(page, 0)).toContainText("デッキ: 火");
}

export async function decideNpcSeat(page: Page) {
  await reloadUntilVisible(page, seatItem(page, 1).getByLabel("アバター"));
  await seatItem(page, 1)
    .getByLabel("アバター")
    .selectOption({ label: "炎の剣士" });
  await seatItem(page, 1)
    .getByLabel("デッキ")
    .selectOption({ label: "火の NPC デッキ" });
  await seatItem(page, 1)
    .getByRole("button", { name: "席 2 を決める" })
    .click();
  await expect(seatItem(page, 1)).toContainText("アバター: 炎の剣士");
  await expect(seatItem(page, 1)).toContainText("デッキ: 火の NPC デッキ");
}
