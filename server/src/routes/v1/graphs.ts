import { Elysia, t } from "elysia";

const ENGINE_URL = Bun.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = Bun.env.ENGINE_API_KEY ?? "";

export const graphsRoute = new Elysia().post(
  "/graphs",
  async ({ body, set }) => {
    if (body.max_height < body.num_balls) {
      set.status = 400;
      return { error: "max_height must be >= num_balls" };
    }

    let engineRes: Response;
    try {
      engineRes = await fetch(`${ENGINE_URL}/v1/graphs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": ENGINE_API_KEY,
        },
        body: JSON.stringify(body),
      });
    } catch {
      set.status = 503;
      return { error: "Engine unavailable" };
    }

    if (!engineRes.ok) {
      set.status = engineRes.status;
      return engineRes.text();
    }

    return new Response(engineRes.body, {
      headers: { "Content-Type": "application/json" },
    });
  },
  {
    body: t.Object({
      num_balls: t.Integer({ minimum: 1, maximum: 32 }),
      max_height: t.Integer({ minimum: 1, maximum: 32 }),
      compact: t.Optional(t.Boolean({ default: false })),
    }),
  },
);
