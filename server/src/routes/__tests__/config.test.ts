import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

import { configRoute } from "../v1/config";

const app = new Elysia().use(configRoute);

describe("GET /config", () => {
  it("returns max_max_height", async () => {
    const res = await app.handle(new Request("http://localhost/config"));
    const body = await res.json();
    expect(body.max_max_height).toBe(32);
  });
});
