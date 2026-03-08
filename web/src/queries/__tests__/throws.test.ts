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

const params = { state: 7, max_height: 5 };

describe("useThrowsQuery", () => {
  it("constructs URL with state and max_height params", async () => {
    const fn = mockFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ throws: [] }), { status: 200 })),
    );

    const { useThrowsQuery } = await import("../throws");
    renderHook(() => useThrowsQuery(params), { wrapper: createWrapper() });

    await waitFor(() => expect(fn).toHaveBeenCalled());
    const [url] = fn.mock.calls[0] as unknown as [string];
    expect(url).toContain("/api/v1/state-notation/throws?");
    expect(url).toContain("state=7");
    expect(url).toContain("max_height=5");
    expect(url).toContain("compact=true");
  });

  it("returns parsed JSON on 200", async () => {
    const data = { throws: [{ height: 3 }] } as const;
    mockFetch(() => Promise.resolve(new Response(JSON.stringify(data), { status: 200 })));

    const { useThrowsQuery } = await import("../throws");
    const { result } = renderHook(() => useThrowsQuery(params), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data as unknown).toEqual(data);
  });

  it("throws HttpError(429) with Retry-After", async () => {
    mockFetch(() =>
      Promise.resolve(new Response("", { status: 429, headers: { "Retry-After": "20" } })),
    );

    const { useThrowsQuery } = await import("../throws");
    const { result } = renderHook(() => useThrowsQuery(params), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toContain("20");
    expect((result.current.error as unknown as { status: number }).status).toBe(429);
  });

  it("throws HttpError with text body on non-ok", async () => {
    mockFetch(() => Promise.resolve(new Response("Bad request", { status: 400 })));

    const { useThrowsQuery } = await import("../throws");
    const { result } = renderHook(() => useThrowsQuery(params), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toBe("Bad request");
    expect((result.current.error as unknown as { status: number }).status).toBe(400);
  });
});
