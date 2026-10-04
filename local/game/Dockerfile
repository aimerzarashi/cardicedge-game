FROM node:24.21.0-bookworm-slim

# package.json の packageManager で指定した pnpm を corepack が取得する
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm

# ホストのユーザー(uid 1000)と同じ node ユーザーで動かし、生成物を root 所有にしない
USER node
WORKDIR /home/node/app

# ボリュームは初回作成時にマウント先の所有者を引き継ぐため、node 所有で作っておく
RUN mkdir -p /home/node/.cache
