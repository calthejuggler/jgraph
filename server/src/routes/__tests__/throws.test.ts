import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

import { authed, engineReturns, mockFetchEngine, resetMocks } from "./helpers";

const { loggingPlugin } = await import("../../lib/logging");
const { throwsRoute } = await import("../v1/state-notation/throws");

const app = new Elysia().use(loggingPlugin).use(throwsRoute);

beforeEach(resetMocks);

describe("GET /throws", () => {
  it("rejects state bits exceeding max_height with 400", async () => {
    authed();
    // state=32 (0b100000) exceeds max_height=5 (max state = 2^5 - 1 = 31)
    const res = await app.handle(new Request("http://localhost/throws?state=32&max_height=5"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("state bits");
  });

  it("accepts state within max_height bounds", async () => {
    authed();
    engineReturns({ throws: [{ height: 3, destination: "00111" }] });

    // state=7 (0b111) fits within max_height=5
    const res = await app.handle(new Request("http://localhost/throws?state=7&max_height=5"));
    expect(res.status).toBe(200);
  });

  it("passes state param to engine", async () => {
    authed();
    engineReturns({ throws: [] });

    await app.handle(new Request("http://localhost/throws?state=7&max_height=5"));

    const [path, params] = mockFetchEngine.mock.calls[0];
    expect(path).toBe("throws");
    expect(params.get("state")).toBe("7");
    expect(params.get("max_height")).toBe("5");
  });
});
