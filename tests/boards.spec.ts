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
  await expect(rows.nth(3)).toContainText("公開中B");
  await expect(rows.nth(3)).toContainText("3×2");
  await expect(rows.nth(5)).toContainText("公開中C");
  await expect(rows.nth(5)).toContainText("6×2");
  await expect(page.getByText("使用不可")).toHaveCount(0);
});

test("一覧に、ボードごとのマスの数と既定のルールが出る", async ({ page }) => {
  await openBoards(page);

  const rows = page.getByRole("row");
  await expect(rows.nth(1)).toContainText(
    "拠点 1・チェックポイント 1・土地 0（火 0・地 0・水 0・風 0・無 0・複 0）・転送円 0・橋 0・聖堂 0・ほこら 0・占い館 0・カード屋 0",
  );
  await expect(rows.nth(2)).toContainText(
    "既定のルール: 目標の魔力 8000・開始時の魔力 600・周回のボーナス 300・チェックポイントのボーナス 100",
  );
  await expect(rows.nth(3)).toContainText(
    "拠点 1・チェックポイント 1・土地 2（火 1・地 0・水 0・風 0・無 0・複 1）・転送円 0・橋 0・聖堂 0・ほこら 0・占い館 0・カード屋 0",
  );
  await expect(rows.nth(4)).toContainText(
    "既定のルール: 目標の魔力 5000・開始時の魔力 0・周回のボーナス 200・チェックポイントのボーナス 50",
  );
  await expect(rows.nth(5)).toContainText(
    "拠点 1・チェックポイント 1・土地 0（火 0・地 0・水 0・風 0・無 0・複 0）・転送円 4・橋 2・聖堂 1・ほこら 1・占い館 1・カード屋 1",
  );
});

test("詳細に、既定のルールの 4 つの値が出る", async ({ page }) => {
  await openBoards(page);

  await page.getByRole("link", { name: "公開中B" }).click();

  const rules = page.getByRole("region", { name: "既定のルール" });
  await expect(rules.getByText("対戦を始めるときに変えられる")).toBeVisible();
  await expect(rules.locator("dt")).toHaveText([
    "目標の魔力",
    "開始時の魔力",
    "周回のボーナス",
    "チェックポイントのボーナス",
  ]);
  await expect(rules.locator("dd")).toHaveText(["5000", "0", "200", "50"]);
});

test("一覧から開いたボードに、置いてあるマスが種類と属性つきで出て、マスの無い所は描かれず、凡例に 14 個出る", async ({
  page,
}) => {
  await openBoards(page);

  await page.getByRole("link", { name: "公開中B" }).click();

  await expect(page.getByRole("heading", { name: "公開中B" })).toBeVisible();
  const grid = page.getByRole("group", { name: "ボードの格子" });
  await expect(grid.getByLabel("(0, 0) のマス 拠点")).toBeAttached();
  await expect(grid.getByLabel("(1, 0) のマス 火属性の土地")).toBeAttached();
  await expect(
    grid.getByLabel("(2, 0) のマス チェックポイント"),
  ).toBeAttached();
  await expect(grid.getByLabel("(1, 1) のマス 複属性の土地")).toBeAttached();
  // マスの無い所は描かない
  await expect(grid.getByLabel(/^\(0, 1\) のマス/)).toHaveCount(0);
  await expect(page.getByLabel("凡例").locator("li")).toHaveText([
    "拠点",
    "チェックポイント",
    "火属性の土地",
    "地属性の土地",
    "水属性の土地",
    "風属性の土地",
    "無属性の土地",
    "複属性の土地",
    "転送円",
    "橋",
    "聖堂",
    "ほこら",
    "占い館",
    "カード屋",
  ]);
  // マスとマスの間は描かない（つながりの印は studio の編集のためのもの）
  await expect(grid.getByRole("button", { name: /のつながり$/ })).toHaveCount(
    0,
  );
});

test("転送円と橋に対の番号が出て、番号は転送円と橋で別に対ごとに振られ、色が付く", async ({
  page,
}) => {
  await openBoards(page);
  await page.getByRole("link", { name: "公開中C" }).click();

  const grid = page.getByRole("group", { name: "ボードの格子" });
  const warp = [
    ["(1, 0)", "1-1"],
    ["(1, 1)", "1-2"],
    ["(5, 0)", "2-1"],
    ["(5, 1)", "2-2"],
  ] as const;
  for (const [position, number] of warp) {
    const tile = grid.getByLabel(`${position} のマス 転送円 ${number}`);
    await expect(tile).toHaveText(number);
    await expect(tile).toHaveCSS("background-color", "rgb(32, 178, 170)");
  }
  for (const [position, number] of [
    ["(2, 0)", "1-1"],
    ["(2, 1)", "1-2"],
  ] as const) {
    const tile = grid.getByLabel(`${position} のマス 橋 ${number}`);
    await expect(tile).toHaveText(number);
    await expect(tile).toHaveCSS("background-color", "rgb(139, 90, 43)");
  }
});

test("施設の 4 つのマスに、名前と 1 文字と色が出る", async ({ page }) => {
  await openBoards(page);
  await page.getByRole("link", { name: "公開中C" }).click();

  const grid = page.getByRole("group", { name: "ボードの格子" });
  for (const [position, label, glyph] of [
    ["(3, 0)", "聖堂", "聖"],
    ["(4, 0)", "ほこら", "祠"],
    ["(3, 1)", "占い館", "占"],
    ["(4, 1)", "カード屋", "店"],
  ] as const) {
    const tile = grid.getByLabel(`${position} のマス ${label}`, {
      exact: true,
    });
    await expect(tile).toHaveText(glyph);
    await expect(tile).toHaveCSS("background-color", "rgb(58, 63, 85)");
  }
  // 土地・拠点・チェックポイントには文字を書かない
  await expect(grid.getByLabel("(0, 0) のマス 拠点")).toHaveText("");
});

test("地属性は緑、風属性は黄土色で出る", async ({ page }) => {
  await openBoards(page);
  const legend = page.getByLabel("凡例");

  await page.getByRole("link", { name: "公開中B" }).click();
  // 凡例の見本の色（地・風）。公開中のボードに地・風の土地は無いため、見本で確かめる
  await expect(
    legend.locator("li", { hasText: "地属性の土地" }).locator("span"),
  ).toHaveCSS("background-color", "rgb(95, 174, 95)");
  await expect(
    legend.locator("li", { hasText: "風属性の土地" }).locator("span"),
  ).toHaveCSS("background-color", "rgb(200, 162, 74)");
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
