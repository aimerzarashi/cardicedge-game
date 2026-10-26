// 開発・テスト用の、メールアドレスを確認済みのプレイヤーを作る（既にあれば何もしない）。本番では使わない。
import { auth } from "../lib/auth.ts";

const player = {
  email: process.env.SEED_PLAYER_EMAIL ?? "player@example.com",
  password: process.env.SEED_PLAYER_PASSWORD ?? "player-password",
};

// サインアップの API は確認メールを送り、確認済みにできないため、better-auth の内部の API で作る
// （手順は Admin プラグインの createUser と同じ。ユーザーを作り、パスワードを credential のアカウントとして結びつける）
const ctx = await auth.$context;
if (await ctx.internalAdapter.findUserByEmail(player.email)) {
  console.log(`player already exists: ${player.email}`);
} else {
  const user = await ctx.internalAdapter.createUser(
    {
      email: player.email,
      // better-auth の name は必須の列だが使わない（プレイヤーのプロフィールは core に持つ）
      name: "",
      emailVerified: true,
    },
    { method: "seed" },
  );
  await ctx.internalAdapter.linkAccount({
    providerId: "credential",
    accountId: user.id,
    userId: user.id,
    password: await ctx.password.hash(player.password),
  });
  console.log(`seeded player: ${player.email}`);
}
process.exit(0);
