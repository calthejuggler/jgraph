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

describe("useTableQuery", () => {
  it("constructs URL with /table endpoint", async () => {
    const fn = mockFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ rows: [] }), { status: 200 })),
    );

    const { useTableQuery } = await import("../table");
    renderHook(() => useTableQuery(params, true), { wrapper: createWrapper() });

    await waitFor(() => expect(fn).toHaveBeenCalled());
    const [url] = fn.mock.calls[0] as unknown as [string];
    expect(url).toContain("/api/v1/state-notation/table?");
    expect(url).toContain("num_props=3");
    expect(url).toContain("max_height=5");
    expect(url).toContain("compact=true");
  });

  it("returns parsed JSON on 200", async () => {
    const data = { rows: [{ id: 1 }] } as const;
    mockFetch(() => Promise.resolve(new Response(JSON.stringify(data), { status: 200 })));

    const { useTableQuery } = await import("../table");
    const { result } = renderHook(() => useTableQuery(params, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data as unknown).toEqual(data);
  });

  it("throws HttpError(429) with Retry-After", async () => {
    mockFetch(() =>
      Promise.resolve(new Response("", { status: 429, headers: { "Retry-After": "45" } })),
    );

    const { useTableQuery } = await import("../table");
    const { result } = renderHook(() => useTableQuery(params, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toContain("45");
    expect((result.current.error as unknown as { status: number }).status).toBe(429);
  });

  it("throws HttpError with text body on non-ok", async () => {
    mockFetch(() => Promise.resolve(new Response("Server error", { status: 500 })));

    const { useTableQuery } = await import("../table");
    const { result } = renderHook(() => useTableQuery(params, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toBe("Server error");
    expect((result.current.error as unknown as { status: number }).status).toBe(500);
  });

  it("throws HttpError with fallback message on empty body", async () => {
    mockFetch(() => Promise.resolve(new Response("", { status: 503 })));

    const { useTableQuery } = await import("../table");
    const { result } = renderHook(() => useTableQuery(params, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toContain("503");
  });
});
