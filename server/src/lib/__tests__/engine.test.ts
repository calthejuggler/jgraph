import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import { fetchEngine } from "../engine";
import type { WideEvent } from "../logging";

const originalFetch = globalThis.fetch;

function mockFetch(impl: () => Promise<Response>) {
  const fn = mock(impl);
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function makeWideEvent(): WideEvent {
  return {};
}

describe("fetchEngine", () => {
  beforeEach(() => {
    mockFetch(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
  });

  it("returns ok:true with the engine response on success", async () => {
    const result = await fetchEngine("validate", new URLSearchParams(), "req-1", makeWideEvent());
    expect(result.ok).toBe(true);
    expect(result.response.status).toBe(200);
  });

  it("returns ok:false with 503 when fetch throws", async () => {
    mockFetch(() => Promise.reject(new Error("connection refused")) as Promise<Response>);

    const result = await fetchEngine("validate", new URLSearchParams(), "req-1", makeWideEvent());
    expect(result.ok).toBe(false);
    expect(result.response.status).toBe(503);

    const body = await result.response.json();
    expect(body).toEqual({ error: "Engine unavailable" });
  });

  it("returns ok:false with engine status when engine returns non-ok", async () => {
    mockFetch(() => Promise.resolve(new Response("bad", { status: 422 })));

    const result = await fetchEngine("validate", new URLSearchParams(), "req-1", makeWideEvent());
    expect(result.ok).toBe(false);
    expect(result.response.status).toBe(422);
  });

  it("sets wideEvent.engine_status on success", async () => {
    const wideEvent = makeWideEvent();
    await fetchEngine("validate", new URLSearchParams(), "req-1", wideEvent);
    expect(wideEvent.engine_status).toBe(200);
  });

  it("sets wideEvent.error_message when fetch throws", async () => {
    mockFetch(() => Promise.reject(new Error("connection refused")) as Promise<Response>);

    const wideEvent = makeWideEvent();
    await fetchEngine("validate", new URLSearchParams(), "req-1", wideEvent);
    expect(wideEvent.error_message).toBe("Engine unavailable");
  });

  it("sets wideEvent.error_message when engine returns non-ok", async () => {
    mockFetch(() => Promise.resolve(new Response("bad", { status: 500 })));

    const wideEvent = makeWideEvent();
    await fetchEngine("validate", new URLSearchParams(), "req-1", wideEvent);
    expect(wideEvent.error_message).toBe("Engine returned 500");
  });

  it("passes X-API-Key and X-Request-ID headers", async () => {
    const fn = mockFetch(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 })));

    await fetchEngine("validate", new URLSearchParams({ n: "3" }), "req-42", makeWideEvent());

    expect(fn).toHaveBeenCalledTimes(1);
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/v1/state-notation/validate");
    expect(url).toContain("n=3");

    const headers = init.headers as Record<string, string>;
    expect(headers["X-Request-ID"]).toBe("req-42");
    expect(headers).toHaveProperty("X-API-Key");
  });
});
