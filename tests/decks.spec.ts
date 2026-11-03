import type { Page } from "@playwright/test";
import { login, signUpAndVerify } from "./account";
import { expect, test } from "./fixtures";

// マスタ（local/core-master/master.sql）のスターターデッキ: 火（A 4 枚・B 1 枚）・水（A 2 枚・B 3 枚・C 2 枚）。
// A・B・C はすべてクリーチャー。登録すると両方を受け取る。受け取りもデッキの表示も遅れて届くため、再読み込みして待つ

async function openDecks(
  page: Page,
  request: Parameters<typeof signUpAndVerify>[1],
) {
  const email = `decks-${Date.now()}@example.com`;
  await signUpAndVerify(page, request, email, "player-password");
  await login(page, email, "player-password");
  await expect(page.getByTestId("player-email")).toHaveText(email);
  await expect(async () => {
    await page.reload();
    await expect(page.getByTestId("starter-grant")).toHaveText(
      "スターターを受け取りました",
      { timeout: 1000 },
    );
  }).toPass({ timeout: 30_000 });
  await page.getByRole("link", { name: "デッキ" }).click();
  await expect(page).toHaveURL(/\/decks$/);
  await expect(async () => {
    await page.reload();
    await expect(page.locator("tbody tr")).toHaveCount(2, { timeout: 1000 });
  }).toPass({ timeout: 30_000 });
}

test("一覧に自分のスターターのデッキが、合計の枚数と種類ごとの枚数と一緒に出る", async ({
  page,
  request,
}) => {
  await openDecks(page, request);

  const rows = page.locator("tbody tr");
  await expect(rows.nth(0)).toContainText("火");
  await expect(rows.nth(0)).toContainText("5 枚");
  await expect(rows.nth(0)).toContainText(
    "クリーチャー 5・アイテム 0・スペル 0",
  );
  await expect(rows.nth(1)).toContainText("水");
  await expect(rows.nth(1)).toContainText("7 枚");
  await expect(rows.nth(1)).toContainText(
    "クリーチャー 7・アイテム 0・スペル 0",
  );
});

test("詳細に、カードと枚数が種類 → 名前の順で出る。無い・形の違う ID は「見つからない」になる", async ({
  page,
  request,
}) => {
  await openDecks(page, request);

  await page.getByRole("link", { name: "水" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("水");
  await expect(page.getByText("合計 7 枚")).toBeVisible();
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toHaveText(/A\s*クリーチャー\s*2/);
  await expect(rows.nth(1)).toHaveText(/B\s*クリーチャー\s*3/);
  await expect(rows.nth(2)).toHaveText(/C\s*クリーチャー\s*2/);

  for (const id of ["00000000-0000-4000-8000-0000000000ff", "not-a-uuid"]) {
    await page.goto(`/decks/${id}`);
    await expect(page.getByText("このデッキは見つかりません")).toBeVisible();
  }
});
