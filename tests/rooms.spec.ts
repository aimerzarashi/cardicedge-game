import { login, seedPlayer } from "./account";
import { expect, test } from "./fixtures";
import {
  decideNpcSeat,
  decidePlayerSeat,
  decideRules,
  decideSeats,
  openNewRoom,
  reloadUntilVisible,
} from "./room-flow";

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
  // 順番は core が決めるため、今の番は 2 人のどちらか、参加者の一覧（順番に並ぶ）は 2 人そろい今の番の印が 1 つあることだけを確かめる
  await expect(page.getByTestId("match-current")).toHaveText(/部屋用|炎の剣士/);
  const participants = page.getByTestId("match-participant");
  await expect(participants).toHaveCount(2);
  await expect(page.getByTestId("match-current-mark")).toHaveCount(1);
  await expect(
    participants.filter({ hasText: "プレイヤー・部屋用" }),
  ).toHaveCount(1);
  await expect(participants.filter({ hasText: "NPC・炎の剣士" })).toHaveCount(
    1,
  );
  // NPC が先の順番なら、開いた時点で NPC の番が済んでいる。始めの状態を確かめられるのは、まだ番が来ていないプレイヤーだけ
  const player = participants.filter({ hasText: "プレイヤー" });
  await expect(player.getByTestId("participant-magic")).toHaveText("600");
  await expect(player.getByTestId("participant-position")).toHaveText("(0, 0)");
  await expect(
    player.getByTestId("participant-hand").getByRole("listitem"),
  ).toHaveCount(5);
  // 山札の残りは、デッキの枚数から配った 5 枚を引いた数（火のデッキは 7 枚）
  await expect(player.getByTestId("participant-draw-pile")).toHaveText("2");
  await expect(page.getByTestId("match-rules")).toContainText("目標の魔力9000");
  await expect(page.getByTestId("match-rules")).toContainText("手札の上限6");
  await expect(page.getByTestId("match-rules")).toContainText("配る枚数5");
  // プレイヤーは拠点にいるので、拠点のマスに駒 1 が出る
  await expect(
    page.getByRole("button", { name: "(0, 0) のマス 拠点 駒 1" }),
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
