import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // 開発サーバーへのアクセス元として許可するホスト
  // - game-envoy: Playwright のブラウザ（別コンテナ）が envoy 経由でアクセスする
  // - *.trycloudflare.com: make tunnel の Quick Tunnel 経由でアクセスする
  allowedDevOrigins: ["game-envoy", "*.trycloudflare.com"],
};

export default nextConfig;
