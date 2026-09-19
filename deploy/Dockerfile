FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/desktop/package.json apps/desktop/package.json
COPY packages/domain/package.json packages/domain/package.json

RUN corepack enable && corepack pnpm install --filter @max/api... --frozen-lockfile

COPY apps/api apps/api
COPY packages/domain packages/domain

RUN corepack pnpm --filter @max/domain build \
  && corepack pnpm --filter @max/api build

ENV NODE_ENV=production
EXPOSE 3100

CMD ["corepack", "pnpm", "--filter", "@max/api", "start"]
