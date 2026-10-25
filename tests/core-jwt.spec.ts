import { signUpAndVerify } from "./account";
import { expect, test } from "./fixtures";

// 公開の入口（envoy の 10000）。core の /game/graphql は中継役用の入口には置かない
const publicURL = process.env.PLAYWRIGHT_PUBLIC_URL;

test("game の JWT で core の me を呼ぶと、未登録のプレイヤーとして PlayerNotRegisteredError が返る", async ({
  page,
  request,
}) => {
  if (!publicURL) throw new Error("PLAYWRIGHT_PUBLIC_URL が未設定です");
  // 画面でログインするとトップが core に登録してしまうため、登録していないプレイヤーを確かめるここでは、API でログインする。
  // seed のプレイヤーは、トップを開くほかのテストが登録するので使わず、新しくサインアップしたプレイヤーを使う
  const email = `core-jwt-${Date.now()}@example.com`;
  const password = "core-jwt-password";
  await signUpAndVerify(page, request, email, password);
  const signIn = await page.request.post("/api/auth/sign-in/email", {
    headers: { Origin: "http://game-envoy:10001" },
    data: { email, password },
  });
  expect(signIn.status()).toBe(200);

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
