import { Elysia } from "elysia";

const STATE_SIZE_TO_MAX: Record<string, number> = {
  u8: 8,
  u16: 16,
  u32: 32,
  u64: 64,
  u128: 128,
};
const MAX_MAX_HEIGHT = STATE_SIZE_TO_MAX[Bun.env.STATE_SIZE ?? "u32"] ?? 32;

export const configRoute = new Elysia().get(
  "/config",
  () => ({
    max_max_height: MAX_MAX_HEIGHT,
  }),
  {
    detail: {
      summary: "Get server configuration",
      description:
        "Returns the server's configuration including the maximum allowed height based on STATE_SIZE.",
      tags: ["Config v1"],
    },
  },
);
