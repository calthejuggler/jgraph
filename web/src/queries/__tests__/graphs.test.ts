import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "bun:test";

import {
  createWrapper,
  mockApiUrl,
  mockFetch,
  mockParaglideMessages,
  restoreFetchAfterEach,
} from "./helpers";

mockParaglideMessages();
mockApiUrl();
restoreFetchAfterEach();

const params = { num_props: 3, max_height: 5 };

describe("useGraphQuery", () => {
  it("constructs URL with num_props, max_height, and compact=true", async () => {
    const fn = mockFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ nodes: [] }), { status: 200 })),
    );

    const { useGraphQuery } = await import("../graphs");
    renderHook(() => useGraphQuery(params), { wrapper: createWrapper() });

    await waitFor(() => expect(fn).toHaveBeenCalled());
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/api/v1/state-notation/graph?");
    expect(url).toContain("num_props=3");
    expect(url).toContain("max_height=5");
    expect(url).toContain("compact=true");
    expect(init.credentials).toBe("include");
  });

  it("returns parsed JSON on 200", async () => {
    const data = {
      nodes: [1],
      edges: [{ from: 0, to: 1, throw_height: 3 }],
      num_nodes: 1,
      ground_state: 7,
      num_edges: 1,
      max_height: 5,
      num_props: 3,
    };
    mockFetch(() => Promise.resolve(new Response(JSON.stringify(data), { status: 200 })));

    const { useGraphQuery } = await import("../graphs");
    const { result } = renderHook(() => useGraphQuery(params), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it("throws HttpError(429) with Retry-After header value", async () => {
    mockFetch(() =>
      Promise.resolve(new Response("", { status: 429, headers: { "Retry-After": "30" } })),
    );

    const { useGraphQuery } = await import("../graphs");
    const { result } = renderHook(() => useGraphQuery(params), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toContain("30");
    expect((result.current.error as unknown as { status: number }).status).toBe(429);
  });

  it("throws HttpError(429) with default 60s when no Retry-After", async () => {
    mockFetch(() => Promise.resolve(new Response("", { status: 429 })));

    const { useGraphQuery } = await import("../graphs");
    const { result } = renderHook(() => useGraphQuery(params), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toContain("60");
  });

  it("throws HttpError with JSON .error field when response has JSON body", async () => {
    mockFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Custom engine error" }), { status: 500 }),
      ),
    );

    const { useGraphQuery } = await import("../graphs");
    const { result } = renderHook(() => useGraphQuery(params), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toBe("Custom engine error");
    expect((result.current.error as unknown as { status: number }).status).toBe(500);
  });

  it("throws HttpError with raw text when JSON parse fails", async () => {
    mockFetch(() => Promise.resolve(new Response("plain error text", { status: 502 })));

    const { useGraphQuery } = await import("../graphs");
    const { result } = renderHook(() => useGraphQuery(params), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toBe("plain error text");
    expect((result.current.error as unknown as { status: number }).status).toBe(502);
  });

  it("throws HttpError with fallback message when body is empty", async () => {
    mockFetch(() => Promise.resolve(new Response("", { status: 503 })));

    const { useGraphQuery } = await import("../graphs");
    const { result } = renderHook(() => useGraphQuery(params), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toContain("503");
    expect((result.current.error as unknown as { status: number }).status).toBe(503);
  });
});
