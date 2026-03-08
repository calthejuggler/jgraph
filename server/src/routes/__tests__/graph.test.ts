import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

import {
  authed,
  engineReturns,
  engineUnavailable,
  mockFetchEngine,
  resetMocks,
  unauthed,
} from "./helpers";

const { loggingPlugin } = await import("../../lib/logging");
const { graphRoute } = await import("../v1/state-notation/graph");

const app = new Elysia().use(loggingPlugin).use(graphRoute);

beforeEach(resetMocks);

describe("GET /graph", () => {
  it("rejects max_height < num_props with 400", async () => {
    authed();
    const res = await app.handle(new Request("http://localhost/graph?num_props=5&max_height=3"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("max_height");
  });

  it("returns 401 when not authenticated", async () => {
    unauthed();
    const res = await app.handle(new Request("http://localhost/graph?num_props=3&max_height=5"));
    expect(res.status).toBe(401);
  });

  it("returns 304 when ETag matches", async () => {
    authed();
    const etag = '"v1-3-5-false-false"';
    const res = await app.handle(
      new Request("http://localhost/graph?num_props=3&max_height=5", {
        headers: { "If-None-Match": etag },
      }),
    );
    expect(res.status).toBe(304);
    expect(mockFetchEngine).not.toHaveBeenCalled();
  });

  it("forwards to engine and returns response with ETag", async () => {
    authed();
    engineReturns({ nodes: [], edges: [], ground_state: "00111" });

    const res = await app.handle(new Request("http://localhost/graph?num_props=3&max_height=5"));
    expect(res.status).toBe(200);
    expect(res.headers.get("ETag")).toBeTruthy();
    expect(res.headers.get("Cache-Control")).toBe("public, no-cache");

    expect(mockFetchEngine).toHaveBeenCalledTimes(1);
    const [path, params] = mockFetchEngine.mock.calls[0];
    expect(path).toBe("graph");
    expect(params.get("num_props")).toBe("3");
    expect(params.get("max_height")).toBe("5");
  });

  it("returns engine error status when engine fails", async () => {
    authed();
    engineUnavailable();

    const res = await app.handle(new Request("http://localhost/graph?num_props=3&max_height=5"));
    expect(res.status).toBe(503);
  });
});
