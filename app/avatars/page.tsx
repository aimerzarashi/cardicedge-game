import Link from "next/link";
import { currentPlayer } from "@/lib/player";
import { RegisterAvatarForm } from "./register-avatar-form";

export default async function AvatarsPage() {
  const player = await currentPlayer();

  return (
    <main>
      <h1>アバター</h1>
      <p>
        <Link href="/">トップへ</Link>
      </p>
      {player.ok ? (
        player.data.avatars.length === 0 ? (
          <p>まだアバターがありません</p>
        ) : (
          <ul data-testid="avatars">
            {player.data.avatars.map((avatar) => (
              <li key={avatar.id}>{avatar.name}</li>
            ))}
          </ul>
        )
      ) : (
        <p role="alert">
          core に接続できません。時間をおいて再読み込みしてください。
        </p>
      )}
      <h2>アバターを作る</h2>
      <RegisterAvatarForm />
    </main>
  );
}
