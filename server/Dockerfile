FROM oven/bun AS builder

WORKDIR /app

COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install --frozen-lockfile

COPY ./src ./src
COPY ./drizzle ./drizzle

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=builder /app/server server
COPY --from=builder /app/drizzle ./drizzle

ENV NODE_ENV=production

EXPOSE 3000

CMD ["./server"]
