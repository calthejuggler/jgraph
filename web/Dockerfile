ARG BUN_VERSION=1.3.10
FROM oven/bun:${BUN_VERSION}-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN bun run build

FROM caddy:alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/dist /srv
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1
