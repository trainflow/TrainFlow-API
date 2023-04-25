FROM node:18-alpine AS node-base
RUN corepack enable && corepack prepare pnpm@8.1.0 --activate

FROM node-base AS build
WORKDIR /app

COPY pnpm-lock.yaml ./
RUN pnpm fetch
COPY package.json .
RUN pnpm --offline install

COPY . .
RUN pnpm build
