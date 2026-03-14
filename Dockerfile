FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV ASTRO_ADAPTER=node
ENV NODE_RUNTIME=1
# Build tanpa wrangler (tidak dibutuhkan di Docker) dan skip astro check agar lebih cepat
RUN node_modules/.bin/astro build

FROM base AS runner
RUN addgroup --system --gid 1001 astrojs \
 && adduser --system --uid 1001 astro
COPY --from=build --chown=astro:astrojs /app/dist ./dist
COPY --from=build /app/package.json ./package.json
RUN mkdir -p /app/data && chown -R astro:astrojs /app/data
USER astro
# PORT hanya untuk komunikasi internal antar container via nginx-net
# Tidak ada `ports:` di docker-compose — hanya nginx-proxy yang expose ke host
ENV HOST=0.0.0.0
ENV PORT=4321
CMD ["node", "./dist/server/entry.mjs"]
