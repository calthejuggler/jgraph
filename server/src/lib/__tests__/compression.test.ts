import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

import { compressionPlugin } from "../compression";

const LARGE_STRING = "x".repeat(2048);
const LARGE_OBJECT = { data: "y".repeat(2048) };
const SMALL_OBJECT = { ok: true };

function createApp() {
  return new Elysia()
    .use(compressionPlugin)
    .get("/json-small", () => SMALL_OBJECT)
    .get("/json-large", () => LARGE_OBJECT)
    .get("/string-large", () => LARGE_STRING)
    .get("/response-obj", () => new Response(LARGE_STRING));
}

function req(path: string, acceptEncoding?: string) {
  const headers: Record<string, string> = {};
  if (acceptEncoding) headers["accept-encoding"] = acceptEncoding;
  return new Request(`http://localhost${path}`, { headers });
}

describe("compressionPlugin", () => {
  it("does not compress when accept-encoding lacks gzip", async () => {
    const app = createApp();
    const res = await app.handle(req("/json-large", "br"));
    expect(res.headers.get("content-encoding")).toBeNull();
  });

  it("does not compress small JSON responses", async () => {
    const app = createApp();
    const res = await app.handle(req("/json-small", "gzip"));
    expect(res.headers.get("content-encoding")).toBeNull();

    const body = await res.json();
    expect(body).toEqual(SMALL_OBJECT);
  });

  it("compresses large JSON responses and sets content-encoding", async () => {
    const app = createApp();
    const res = await app.handle(req("/json-large", "gzip"));
    expect(res.headers.get("content-encoding")).toBe("gzip");

    const buf = await res.arrayBuffer();
    const decompressed = Bun.gunzipSync(Buffer.from(buf));
    const body = JSON.parse(new TextDecoder().decode(decompressed));
    expect(body).toEqual(LARGE_OBJECT);
  });

  it("compresses large string responses", async () => {
    const app = createApp();
    const res = await app.handle(req("/string-large", "gzip"));
    expect(res.headers.get("content-encoding")).toBe("gzip");

    const buf = await res.arrayBuffer();
    const decompressed = Bun.gunzipSync(Buffer.from(buf));
    expect(new TextDecoder().decode(decompressed)).toBe(LARGE_STRING);
  });

  it("does not compress Response objects", async () => {
    const app = createApp();
    const res = await app.handle(req("/response-obj", "gzip"));
    expect(res.headers.get("content-encoding")).toBeNull();

    const body = await res.text();
    expect(body).toBe(LARGE_STRING);
  });
});
