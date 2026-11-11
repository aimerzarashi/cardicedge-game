import { login, seedPlayer, signUpAndVerify } from "./account";
import { expect, test } from "./fixtures";

// マスタ（local/core-master/master.sql）のスターターデッキは 火（A 4・B 3）と 水（A 1・B 2・C 1・E 1・F 1・G 1）で、所持品はデッキを作れる枚数
// （カードごとに多いほうの枚数。A 4・B 3・C 1・E 1・F 1・G 1。startergrant の collectionOf）。A・B・C はクリーチャーで、性能は
// A（10・N）・B（20・S）・C（30・R）。E・F・G はスペル（10・N。E はカードを 1 枚引く、F は次の目を 6 にする呪い、G はクリーチャーに 20 ダメージ）

test("スターターを受け取ると所持カードに枚数つきで出て、種類で絞れ、カード名から詳細へ移れる", async ({
  page,
  request,
}) => {
  const email = `collection-${Date.now()}@example.com`;
  await signUpAndVerify(page, request, email, "player-password");
  await login(page, email, "player-password");
  await expect(page.getByTestId("player-email")).toHaveText(email);
  await page.getByRole("link", { name: "所持カード" }).click();
  await expect(page).toHaveURL(/\/collection$/);
  // 受け取りも所持品の投影も遅れて届くため、出るまで再読み込みして待つ
  const rows = page.locator("tbody tr");
  await expect(async () => {
    await page.reload();
    await expect(rows).toHaveCount(6, { timeout: 1000 });
  }).toPass({ timeout: 30_000 });

  await expect(rows.nth(0)).toHaveText(/A\s*クリーチャー\s*10\s*N\s*4/);
  await expect(rows.nth(1)).toHaveText(/B\s*クリーチャー\s*20\s*S\s*3/);
  await expect(rows.nth(2)).toHaveText(/C\s*クリーチャー\s*30\s*R\s*1/);
  await expect(rows.nth(3)).toHaveText(/E\s*スペル\s*10\s*N\s*1/);
  await expect(rows.nth(4)).toHaveText(/F\s*スペル\s*10\s*N\s*1/);
  await expect(rows.nth(5)).toHaveText(/G\s*スペル\s*10\s*N\s*1/);

  await page.getByLabel("アイテム").check();
  await page.getByRole("button", { name: "絞り込む" }).click();
  await expect(page).toHaveURL(/\/collection\?type=ITEM$/);
  await expect(page.getByText("カードを持っていません")).toBeVisible();

  await page.getByLabel("アイテム").uncheck();
  await page.getByRole("button", { name: "絞り込む" }).click();
  await page.getByRole("link", { name: "C", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("C");
  await expect(page.locator("dl")).toHaveText(
    /種類\s*クリーチャー\s*コスト\s*30\s*希少度\s*R\s*属性\s*火水\s*AT\s*30\s*HP\s*40\s*アイテム制限\s*防具・巻物\s*配置制限\s*風\s*能力\s*防御型・通行料の倍率 150%・後手/,
  );
});

test("無い・形の違う ID のカードは「見つからない」になる", async ({ page }) => {
  await login(page, seedPlayer.email, seedPlayer.password);
  await expect(page.getByTestId("player-email")).toHaveText(seedPlayer.email);

  for (const id of ["00000000-0000-4000-8000-0000000000ff", "not-a-uuid"]) {
    await page.goto(`/cards/${id}`);
    await expect(page.getByText("このカードは見つかりません")).toBeVisible();
  }
});

test("アイテムのカードの詳細に、分類と AT・HP の増減が出る", async ({
  page,
}) => {
  await login(page, seedPlayer.email, seedPlayer.password);
  await expect(page.getByTestId("player-email")).toHaveText(seedPlayer.email);
  // D は防具で AT -5・HP +25（local/core-master/master.sql）
  await page.goto("/cards/00000000-0000-4000-8000-00000000000d");
  await expect(page.locator("dl")).toHaveText(
    /種類\s*アイテム\s*コスト\s*15\s*希少度\s*N\s*分類\s*防具\s*増減\s*AT -5・HP \+25/,
  );
});

test("スペルのカードの詳細に、効果が出る", async ({ page }) => {
  await login(page, seedPlayer.email, seedPlayer.password);
  await expect(page.getByTestId("player-email")).toHaveText(seedPlayer.email);
  // E はカードを 1 枚引くスペル（local/core-master/master.sql）
  await page.goto("/cards/00000000-0000-4000-8000-00000000000e");
  await expect(page.locator("dl")).toHaveText(
    /種類\s*スペル\s*コスト\s*10\s*希少度\s*N\s*効果\s*カードを 1 枚引く/,
  );
});
