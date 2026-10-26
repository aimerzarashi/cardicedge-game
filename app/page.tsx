import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { currentPlayer } from "@/lib/player";
import { LogoutButton } from "./logout-button";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  const player = await currentPlayer();

  return (
    <main>
      <h1>game</h1>
      <p>
        ログイン中: <span data-testid="player-email">{session.user.email}</span>
      </p>
      {player.ok ? (
        <p data-testid="starter-grant">
          {player.data.starterGrant === "COMPLETED"
            ? "スターターを受け取りました"
            : "スターターを受け取っています。しばらくしてから再読み込みしてください"}
        </p>
      ) : null}
      {player.ok ? (
        <p>
          <Link href="/avatars">アバター</Link>
        </p>
      ) : (
        <p role="alert">
          core に接続できません。時間をおいて再読み込みしてください。
        </p>
      )}
      <LogoutButton />
    </main>
  );
}
