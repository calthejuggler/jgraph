import { Elysia, t } from "elysia";

const ENGINE_URL = Bun.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = Bun.env.ENGINE_API_KEY ?? "";

const graphQuerySchema = t.Object({
  num_balls: t.Integer({ minimum: 1, maximum: 32 }),
  max_height: t.Integer({ minimum: 1, maximum: 32 }),
  compact: t.Optional(t.Boolean({ default: false })),
});

export const graphsRoute = new Elysia()
  .get(
    "/graphs",
    async ({ query, set, headers }) => {
      if (query.max_height < query.num_balls) {
        set.status = 400;
        return { error: "max_height must be >= num_balls" };
      }

      const etag = `"${query.num_balls}-${query.max_height}-${query.compact ?? false}"`;

      if (headers["if-none-match"] === etag) {
        set.status = 304;
        return;
      }

      const params = new URLSearchParams({
        num_balls: String(query.num_balls),
        max_height: String(query.max_height),
        compact: String(query.compact ?? false),
      });

      let engineRes: Response;
      try {
        engineRes = await fetch(
          `${ENGINE_URL}/v1/graphs?${params}`,
          {
            headers: { "X-API-Key": ENGINE_API_KEY },
          },
        );
      } catch {
        set.status = 503;
        return { error: "Engine unavailable" };
      }

      if (!engineRes.ok) {
        set.status = engineRes.status;
        return engineRes.text();
      }

      return new Response(engineRes.body, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=31536000, immutable",
          ETag: etag,
        },
      });
    },
    { query: graphQuerySchema },
  );
