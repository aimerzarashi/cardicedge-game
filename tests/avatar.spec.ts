import type { APIRequestContext, Page } from "@playwright/test";
import { login, signUpAndVerify } from "./account";
import { expect, test } from "./fixtures";

// 作る数が絡むため、テストごとに新しいプレイヤーでログインして /avatars を開く
async function openAvatars(
  page: Page,
  request: APIRequestContext,
  prefix: string,
) {
  const email = `${prefix}-${Date.now()}@example.com`;
  await signUpAndVerify(page, request, email, "player-password");
  await login(page, email, "player-password");
  await expect(page.getByTestId("player-email")).toHaveText(email);
  await page.getByRole("link", { name: "アバター" }).click();
  await expect(page).toHaveURL(/\/avatars$/);
}

async function createAvatar(page: Page, name: string) {
  await page.getByLabel("名前").fill(name);
  await page.getByRole("button", { name: "作る" }).click();
}

test("アバターが 0 体のときは、まだアバターがないと表示する", async ({
  page,
  request,
}) => {
  await openAvatars(page, request, "avatar-empty");

  await expect(page.getByText("まだアバターがありません")).toBeVisible();
});

test("アバターを作ると、一覧に作った順で出る", async ({ page, request }) => {
  await openAvatars(page, request, "avatar-create");

  await createAvatar(page, "いちばん");
  await expect(page.getByTestId("avatars").getByRole("listitem")).toHaveText([
    "いちばん",
  ]);
  await createAvatar(page, "にばん");

  await expect(page.getByTestId("avatars").getByRole("listitem")).toHaveText([
    "いちばん",
    "にばん",
  ]);
  await expect(page.getByText("まだアバターがありません")).toHaveCount(0);
});

test("名前が空白だけだと、名前を入力するよう誤りが出る", async ({
  page,
  request,
}) => {
  await openAvatars(page, request, "avatar-blank");

  await createAvatar(page, "   ");

  await expect(page.getByText("名前を入力してください")).toBeVisible();
  await expect(page.getByText("まだアバターがありません")).toBeVisible();
});

test("名前が長すぎると、文字数の上限が出て入力した値が残る", async ({
  page,
  request,
}) => {
  await openAvatars(page, request, "avatar-long");
  const name = "あ".repeat(500);

  await createAvatar(page, name);

  await expect(
    page.getByText(/名前は \d+ 文字以内で入力してください/),
  ).toBeVisible();
  await expect(page.getByLabel("名前")).toHaveValue(name);
});

test("同じ名前のアバターは作れず、入力した値が残る", async ({
  page,
  request,
}) => {
  await openAvatars(page, request, "avatar-dup");
  await createAvatar(page, "ぶんしん");
  await expect(page.getByTestId("avatars").getByRole("listitem")).toHaveCount(
    1,
  );

  await createAvatar(page, "ぶんしん");

  await expect(page.getByText("この名前はすでに使われています")).toBeVisible();
  await expect(page.getByLabel("名前")).toHaveValue("ぶんしん");
  await expect(page.getByTestId("avatars").getByRole("listitem")).toHaveCount(
    1,
  );
});

test("上限を超える数のアバターは作れず、上限の体数が出る", async ({
  page,
  request,
}) => {
  await openAvatars(page, request, "avatar-limit");
  for (let i = 1; i <= 5; i++) {
    await createAvatar(page, `アバター${i}`);
    await expect(page.getByTestId("avatars").getByRole("listitem")).toHaveCount(
      i,
    );
  }

  await createAvatar(page, "アバター6");

  await expect(page.getByText("アバターは 5 体までです")).toBeVisible();
  await expect(page.getByTestId("avatars").getByRole("listitem")).toHaveCount(
    5,
  );
});
