import type { Page } from "@playwright/test";
import { login, seedPlayer, signUpAndVerify } from "./account";
import { expect, test } from "./fixtures";

// 受け取り中の間は再読み込みして待つ（登録をきっかけに、core のワーカーが配る）
async function expectStarterReceived(page: Page) {
  await expect(async () => {
    await page.reload();
    await expect(page.getByTestId("starter-grant")).toHaveText(
      "スターターを受け取りました",
      { timeout: 1000 },
    );
  }).toPass({ timeout: 30_000 });
}

test("新しくサインアップしたプレイヤーがトップを開くと core に登録され、スターターを受け取る", async ({
  page,
  request,
}) => {
  const email = `player-${Date.now()}@example.com`;
  await signUpAndVerify(page, request, email, "player-password");

  await login(page, email, "player-password");

  await expect(page.getByTestId("player-email")).toHaveText(email);
  await expectStarterReceived(page);
});

test("もう一度トップを開いても登録が重ならず、同じプレイヤーのまま受け取った表示になる", async ({
  page,
  request,
}) => {
  const email = `player-again-${Date.now()}@example.com`;
  await signUpAndVerify(page, request, email, "player-password");
  await login(page, email, "player-password");
  await expect(page.getByTestId("player-email")).toHaveText(email);
  await expectStarterReceived(page);

  await page.goto("/");

  await expect(page.getByTestId("player-email")).toHaveText(email);
  await expect(page.getByTestId("starter-grant")).toHaveText(
    "スターターを受け取りました",
  );
  await expect(page.getByText("core に接続できません")).toHaveCount(0);
});

test("seed のプレイヤーでもスターターを受け取る", async ({ page }) => {
  await login(page, seedPlayer.email, seedPlayer.password);

  await expect(page.getByTestId("player-email")).toHaveText(seedPlayer.email);
  await expectStarterReceived(page);
});
