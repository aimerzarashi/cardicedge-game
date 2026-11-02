import type { Page } from "@playwright/test";
import { login, seedPlayer } from "./account";
import { expect, test } from "./fixtures";

// マスタ（local/core-master/master.sql）の NPC: 炎の剣士（水 → 火 → 古い（使用不可）の順に割り当て）・森の番人（火）・
// 使用不可の NPC。seed のプレイヤーで読むだけ

async function openNpcAvatars(page: Page) {
  await login(page, seedPlayer.email, seedPlayer.password);
  await expect(page.getByTestId("player-email")).toHaveText(seedPlayer.email);
  await page.getByRole("link", { name: "NPC" }).click();
  await expect(page).toHaveURL(/\/npc-avatars$/);
}

test("一覧に公開中の NPC が名前の順に、使う公開中のデッキと一緒に出て、使用不可の NPC は出ない", async ({
  page,
}) => {
  await openNpcAvatars(page);

  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("森の番人");
  await expect(rows.nth(0)).toContainText("火の NPC デッキ");
  await expect(rows.nth(1)).toContainText("炎の剣士");
  await expect(rows.nth(1)).toContainText("水の NPC デッキ、火の NPC デッキ");
  await expect(page.getByText("使用不可の NPC")).toHaveCount(0);
  await expect(page.getByText("古い NPC デッキ")).toHaveCount(0);
});

test("詳細に、割り当てた順の公開中のデッキごとに、カードと枚数が種類 → 名前の順で出る", async ({
  page,
}) => {
  await openNpcAvatars(page);

  await page.getByRole("link", { name: "炎の剣士" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("炎の剣士");
  const decks = page.getByRole("heading", { level: 2 });
  await expect(decks).toHaveText(["水の NPC デッキ", "火の NPC デッキ"]);
  const water = page.getByRole("region", { name: "水の NPC デッキ" });
  await expect(water.getByText("合計 4 枚")).toBeVisible();
  const rows = water.locator("tbody tr");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toHaveText(/A\s*クリーチャー\s*2/);
  await expect(rows.nth(1)).toHaveText(/C\s*クリーチャー\s*2/);
});

test("使用不可・無い・形の違う ID の NPC は「見つからない」になる", async ({
  page,
}) => {
  await openNpcAvatars(page);

  for (const id of [
    "00000000-0000-4000-8000-0000000000f3",
    "00000000-0000-4000-8000-0000000000ff",
    "not-a-uuid",
  ]) {
    await page.goto(`/npc-avatars/${id}`);
    await expect(page.getByText("この NPC は見つかりません")).toBeVisible();
  }
});
