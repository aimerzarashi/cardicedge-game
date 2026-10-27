import type { Page } from "@playwright/test";
import { login, seedPlayer } from "./account";
import { expect, test } from "./fixtures";

async function openBoards(page: Page) {
  await login(page, seedPlayer.email, seedPlayer.password);
  await expect(page.getByTestId("player-email")).toHaveText(seedPlayer.email);
  await page.getByRole("link", { name: "ボード" }).click();
  await expect(page).toHaveURL(/\/boards$/);
}

function scale(page: Page) {
  return page.locator("[data-scale]");
}

async function scaleOf(page: Page) {
  return Number(await scale(page).getAttribute("data-scale"));
}

test("一覧に公開中のボードが名前の順に出て、使用不可のボードは出ない", async ({
  page,
}) => {
  await openBoards(page);

  const rows = page.getByRole("row");
  await expect(rows.nth(1)).toContainText("公開中A");
  await expect(rows.nth(1)).toContainText("2×1");
  await expect(rows.nth(2)).toContainText("公開中B");
  await expect(rows.nth(2)).toContainText("3×2");
  await expect(page.getByText("使用不可")).toHaveCount(0);
});

test("一覧から開いたボードに、置いてあるマスが種類つきで出る", async ({
  page,
}) => {
  await openBoards(page);

  await page.getByRole("link", { name: "公開中B" }).click();

  await expect(page.getByRole("heading", { name: "公開中B" })).toBeVisible();
  const grid = page.getByRole("group", { name: "ボードの格子" });
  await expect(grid.getByLabel("(0, 0) のマス 拠点")).toBeAttached();
  await expect(grid.getByLabel("(1, 0) のマス 土地")).toBeAttached();
  await expect(
    grid.getByLabel("(2, 0) のマス チェックポイント"),
  ).toBeAttached();
  await expect(grid.getByLabel("(1, 1) のマス 土地")).toBeAttached();
  await expect(
    grid.getByLabel("(0, 1) のマス", { exact: true }),
  ).toBeAttached();
  await expect(
    grid.getByRole("button", { name: "(1, 0) と (2, 0) のつながり" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    grid.getByRole("button", { name: "(0, 0) と (0, 1) のつながり" }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("拡大・縮小・全体を表示のボタンで、表示の倍率が変わる", async ({
  page,
}) => {
  await openBoards(page);
  await page.getByRole("link", { name: "公開中A" }).click();
  await expect(scale(page)).toHaveAttribute("data-scale", /.+/);
  const fitted = await scaleOf(page);

  // 小さなボードは全体を表示した時点で拡大の上限なので、縮小してから拡大する
  await page.getByRole("button", { name: "縮小" }).click();
  const reduced = await scaleOf(page);
  expect(reduced).toBeLessThan(fitted);
  await page.getByRole("button", { name: "拡大" }).click();
  expect(await scaleOf(page)).toBeGreaterThan(reduced);
  await page.getByRole("button", { name: "縮小" }).click();
  await page.getByRole("button", { name: "全体を表示" }).click();
  expect(await scaleOf(page)).toBeCloseTo(fitted, 3);
});

test("使用不可のボードと、無いボードは、見つからないと表示する", async ({
  page,
}) => {
  await openBoards(page);

  await page.goto("/boards/00000000-0000-4000-8000-0000000000b3");
  await expect(page.getByText("このボードは見つかりません")).toBeVisible();

  await page.goto("/boards/00000000-0000-4000-8000-0000000000ff");
  await expect(page.getByText("このボードは見つかりません")).toBeVisible();

  await page.goto("/boards/not-a-uuid");
  await expect(page.getByText("このボードは見つかりません")).toBeVisible();
});
