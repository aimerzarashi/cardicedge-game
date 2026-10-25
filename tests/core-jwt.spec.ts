import { expect, test } from "./fixtures";

// 公開の入口（envoy の 10000）。core の /game/graphql は中継役用の入口には置かない
const publicURL = process.env.PLAYWRIGHT_PUBLIC_URL;

// seed のプレイヤー（scripts/seed.ts）。core には登録していない
const seedPlayer = { email: "player@example.com", password: "player-password" };

test("game の JWT で core の me を呼ぶと、未登録のプレイヤーとして PlayerNotRegisteredError が返る", async ({
  page,
  request,
}) => {
  if (!publicURL) throw new Error("PLAYWRIGHT_PUBLIC_URL が未設定です");
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(seedPlayer.email);
  await page.getByLabel("パスワード").fill(seedPlayer.password);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByTestId("player-email")).toBeVisible();

  const tokenResponse = await page.request.get("/api/auth/token");
  expect(tokenResponse.status()).toBe(200);
  const { token } = await tokenResponse.json();

  // core は game-envoy の JWKS（/api/auth/jwks）で署名を、iss・aud を設定で確かめる
  const response = await request.post(`${publicURL}/game/graphql`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { query: "query { me { __typename } }" },
  });

  expect(response.status()).toBe(200);
  expect((await response.json()).data.me.__typename).toBe(
    "PlayerNotRegisteredError",
  );
});
