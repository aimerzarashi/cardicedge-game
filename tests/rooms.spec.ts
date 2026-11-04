import type { APIRequestContext, Locator, Page } from "@playwright/test";
import { login, seedPlayer, signUpAndVerify } from "./account";
import { expect, test } from "./fixtures";

// 新しくサインアップしたプレイヤー（アバターを 1 体作る）で部屋を作り、詳細を開く。
// 部屋は作った人にしか見えないが、数が絡む一覧の確認のため、テストごとに新しいプレイヤーを使う
async function openNewRoom(
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
async function reloadUntilVisible(page: Page, target: Locator) {
  await expect(async () => {
    await page.reload();
    await expect(target).toBeVisible({ timeout: 1000 });
  }).toPass();
}

function seatItem(page: Page, index: number) {
  return page.getByTestId("seats").getByRole("listitem").nth(index);
}

async function decideSeats(page: Page) {
  await page.getByLabel("席の数").selectOption("2");
  await page.getByRole("button", { name: "席を決める" }).click();
  await expect(page.getByTestId("seats").getByRole("listitem")).toHaveCount(2);
  await expect(seatItem(page, 0)).toContainText("プレイヤー");
  await expect(seatItem(page, 1)).toContainText("NPC");
}

async function decideRules(page: Page) {
  await reloadUntilVisible(page, page.getByLabel("ボード"));
  await page.getByLabel("ボード").selectOption({ label: "公開中A" });
  // 7 つの値は、選んだボードの既定のルールから始まる
  await expect(page.getByLabel("目標の魔力")).toHaveValue("8000");
  await page.getByLabel("目標の魔力").fill("9000");
  await page.getByRole("button", { name: "対戦ルールを決める" }).click();
  await expect(page.getByTestId("match-rules")).toContainText("公開中A");
  await expect(page.getByTestId("match-rules")).toContainText(
    "目標の魔力 9000",
  );
}

async function decidePlayerSeat(page: Page) {
  await reloadUntilVisible(page, seatItem(page, 0).getByLabel("デッキ"));
  await seatItem(page, 0)
    .getByRole("button", { name: "席 1 を決める" })
    .click();
  await expect(seatItem(page, 0)).toContainText("アバター: 部屋用");
  await expect(seatItem(page, 0)).toContainText("デッキ: 火");
}

async function decideNpcSeat(page: Page) {
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

test("部屋を作り、席・対戦ルール・席の選択を決めて公開すると準備中になり、準備完了にすると対戦中になる", async ({
  page,
  request,
}) => {
  await openNewRoom(page, request, "room-flow");
  // 席の並びを決めるまでは、公開できない（core が返す操作の可否で出し分ける）
  await expect(page.getByRole("button", { name: "公開する" })).toHaveCount(0);

  await decideSeats(page);
  await decideRules(page);
  await decidePlayerSeat(page);
  await decideNpcSeat(page);
  await page.getByRole("button", { name: "公開する" }).click();

  await expect(page.getByTestId("room-status")).toHaveText("準備中");
  // 公開前に決めたものは、準備中には選び直せない
  await expect(page.getByRole("button", { name: "席を決める" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "対戦ルールを決める" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^席 \d を決める$/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "準備完了" }).click();

  // プレイヤーは自分だけなので、自分の準備完了で全員がそろい、対戦が始まる。対戦の画面へ移る
  await expect(page).toHaveURL(/\/matches\/[0-9a-f-]{36}$/);
  const matchUrl = page.url();
  await expect(page.getByTestId("match-round")).toHaveText("ラウンド 1 / 30");
  // 順番は core が決めるため、今の番は 2 人のどちらか、順番の一覧は 2 人そろっていることだけを確かめる
  await expect(
    page.getByTestId("match-turn-order").getByRole("listitem"),
  ).toHaveCount(2);
  await expect(page.getByTestId("match-current")).toHaveText(/部屋用|炎の剣士/);
  const participants = page.getByTestId("match-participant");
  await expect(participants).toHaveCount(2);
  await expect(participants.nth(0)).toContainText("プレイヤー・部屋用");
  await expect(participants.nth(1)).toContainText("NPC・炎の剣士");
  for (const index of [0, 1]) {
    const participant = participants.nth(index);
    await expect(participant.getByTestId("participant-magic")).toHaveText(
      "600",
    );
    await expect(participant.getByTestId("participant-position")).toHaveText(
      "(0, 0)",
    );
    await expect(
      participant.getByTestId("participant-hand").getByRole("listitem"),
    ).toHaveCount(5);
  }
  // 山札の残りは、デッキの枚数から配った 5 枚を引いた数（火のデッキは 7 枚、火の NPC デッキは 5 枚）
  await expect(
    participants.nth(0).getByTestId("participant-draw-pile"),
  ).toHaveText("2");
  await expect(
    participants.nth(1).getByTestId("participant-draw-pile"),
  ).toHaveText("0");
  await expect(page.getByTestId("match-rules")).toContainText("目標の魔力9000");
  await expect(page.getByTestId("match-rules")).toContainText("手札の上限6");
  await expect(page.getByTestId("match-rules")).toContainText("配る枚数5");
  // 2 人とも拠点にいるので、拠点のマスに両方の駒が出る
  await expect(
    page.getByRole("button", { name: "(0, 0) のマス 拠点 駒 1 駒 2" }),
  ).toBeVisible();

  // 部屋に戻ると対戦中で、対戦の画面へのリンクがある。対戦中は閉じられない
  await page.goBack();
  await expect(page.getByTestId("room-status")).toHaveText("対戦中");
  await expect(page.getByTestId("participants")).toContainText("準備完了");
  await expect(page.getByRole("button", { name: "準備完了" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "部屋を閉じる" })).toHaveCount(
    0,
  );
  await page.getByRole("link", { name: "対戦の画面へ" }).click();
  await expect(page).toHaveURL(matchUrl);

  await page.getByRole("link", { name: "部屋の一覧へ" }).first().click();
  await expect(page.getByTestId("rooms").getByRole("listitem")).toHaveCount(1);
  await expect(page.getByTestId("rooms")).toContainText(
    "対戦中・席 2・公開中A",
  );

  // 参加していないプレイヤーには、対戦の存在を明かさず「見つからない」になる。形の違う ID も同じ
  await page.goto("/");
  await page.getByRole("button", { name: "ログアウト" }).click();
  await login(page, seedPlayer.email, seedPlayer.password);
  await expect(page.getByTestId("player-email")).toHaveText(seedPlayer.email);
  await page.goto(matchUrl);
  await expect(page.getByText("この対戦は見つかりません")).toBeVisible();
  await page.goto("/matches/not-a-uuid");
  await expect(page.getByText("この対戦は見つかりません")).toBeVisible();
});

test("公開前に決めなかったものは準備中に決められ、決めるまで準備完了を押せない", async ({
  page,
  request,
}) => {
  await openNewRoom(page, request, "room-late");
  await decideSeats(page);
  await page.getByRole("button", { name: "公開する" }).click();
  await expect(page.getByTestId("room-status")).toHaveText("準備中");
  await expect(page.getByRole("button", { name: "準備完了" })).toHaveCount(0);

  await decideRules(page);
  await decidePlayerSeat(page);
  await expect(page.getByRole("button", { name: "準備完了" })).toHaveCount(0);
  await decideNpcSeat(page);
  await expect(page.getByRole("button", { name: "準備完了" })).toBeVisible();
  await page.getByRole("button", { name: "準備完了" }).click();

  await expect(page).toHaveURL(/\/matches\/[0-9a-f-]{36}$/);
  // 準備完了のあとは、決めたものを選び直せない
  await page.goBack();
  await expect(page.getByTestId("participants")).toContainText("準備完了");
  await expect(page.getByRole("button", { name: /を決める$/ })).toHaveCount(0);
});

test("部屋の名前は、作るときも変えるときも、誤りが文言で出て、変えると詳細と一覧に反映される", async ({
  page,
  request,
}) => {
  await openNewRoom(page, request, "room-name");

  await page.getByLabel("部屋の名前").fill("あ".repeat(21));
  await page.getByRole("button", { name: "名前を変える" }).click();
  await expect(page.locator("p[role=alert]")).toContainText(
    "名前は 20 文字以内で入力してください",
  );
  await page.getByLabel("部屋の名前").fill("   ");
  await page.getByRole("button", { name: "名前を変える" }).click();
  await expect(page.locator("p[role=alert]")).toContainText(
    "名前を入力してください",
  );
  await page.getByLabel("部屋の名前").fill("改名した部屋");
  await page.getByRole("button", { name: "名前を変える" }).click();
  await expect(page.getByTestId("room-name")).toHaveText("改名した部屋");

  await page.goto("/rooms");
  await expect(page.getByTestId("rooms")).toContainText("改名した部屋");
  await page.getByLabel("部屋の名前").fill("い".repeat(21));
  await page.getByRole("button", { name: "部屋を作る" }).click();
  await expect(page.locator("p[role=alert]")).toContainText(
    "名前は 20 文字以内で入力してください",
  );
  await expect(page.getByLabel("部屋の名前")).toHaveValue("い".repeat(21));
});

test("対戦ルールの値が正しくないと、core の判定が項目の文言で出る", async ({
  page,
  request,
}) => {
  await openNewRoom(page, request, "room-invalid");
  await reloadUntilVisible(page, page.getByLabel("ボード"));

  await page.getByLabel("開始時の魔力").fill("9000");
  await page.getByLabel("目標の魔力").fill("100");
  await page.getByRole("button", { name: "対戦ルールを決める" }).click();

  await expect(page.locator("p[role=alert]")).toContainText(
    "目標の魔力は「開始時の魔力」より大きくしてください",
  );
  await expect(page.getByLabel("目標の魔力")).toHaveValue("100");
});

test("別の画面で部屋が変わっていると、読み直すよう案内が出る", async ({
  page,
  request,
}) => {
  await openNewRoom(page, request, "room-conflict");
  // 同じ詳細を、もう 1 つの画面でも開いておく
  const other = await page.context().newPage();
  await other.goto(page.url());
  await expect(other.getByTestId("room-status")).toHaveText("公開前");

  await decideSeats(page);

  await other.getByLabel("席の数").selectOption("3");
  await other.getByRole("button", { name: "席を決める" }).click();
  await expect(other.locator("p[role=alert]")).toContainText(
    "ほかの操作で部屋が変わっています。再読み込みしてから、もう一度操作してください",
  );
});

test("部屋を閉じると、一覧に出なくなり、詳細は閉じた状態で操作できない", async ({
  page,
  request,
}) => {
  await openNewRoom(page, request, "room-close");
  const url = page.url();

  await page.getByRole("button", { name: "部屋を閉じる" }).click();

  await expect(page.getByTestId("room-status")).toHaveText("閉じた");
  await expect(page.getByRole("button", { name: "部屋を閉じる" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: "公開する" })).toHaveCount(0);
  await page.goto("/rooms");
  await expect(page.getByText("まだ部屋がありません")).toBeVisible();
  await page.goto(url);
  await expect(page.getByTestId("room-status")).toHaveText("閉じた");
});

test("存在しない部屋・形の違う ID の部屋は「見つからない」になる", async ({
  page,
  request,
}) => {
  await openNewRoom(page, request, "room-missing");

  await page.goto("/rooms/00000000-0000-4000-8000-000000000000");
  await expect(page.getByText("この部屋は見つかりません")).toBeVisible();
  await page.goto("/rooms/not-a-uuid");
  await expect(page.getByText("この部屋は見つかりません")).toBeVisible();
});
