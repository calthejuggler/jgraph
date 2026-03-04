ARG BUN_VERSION=1.3.10
FROM oven/bun:${BUN_VERSION}-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
COPY web/package.json ./web/
COPY server/package.json ./server/
RUN bun install --frozen-lockfile --ignore-scripts
COPY web/ ./web/
RUN cd web && bun run build

FROM caddy:alpine
COPY web/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/web/dist /srv
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1
