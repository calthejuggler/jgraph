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

describe("useConfigQuery", () => {
  it("fetches from /api/v1/config and returns data on success", async () => {
    mockFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ max_max_height: 15 }), { status: 200 })),
    );

    const { useConfigQuery } = await import("../config");
    const { result } = renderHook(() => useConfigQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ max_max_height: 15 });
  });

  it("includes credentials and correct URL", async () => {
    const fn = mockFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ max_max_height: 10 }), { status: 200 })),
    );

    const { useConfigQuery } = await import("../config");
    renderHook(() => useConfigQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(fn).toHaveBeenCalled());
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://test-api/api/v1/config");
    expect(init.credentials).toBe("include");
  });

  it("throws Error on non-ok response", async () => {
    mockFetch(() => Promise.resolve(new Response("", { status: 500 })));

    const { useConfigQuery } = await import("../config");
    const { result } = renderHook(() => useConfigQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
