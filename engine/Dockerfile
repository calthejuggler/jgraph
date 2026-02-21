# build stage
FROM rust:1.93-alpine AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

# final stage
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/engine .
EXPOSE 8000
CMD ["./engine"]
