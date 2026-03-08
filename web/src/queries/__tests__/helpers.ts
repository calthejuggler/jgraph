import type { ReactNode } from "react";
import { createElement } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, mock } from "bun:test";

export function mockParaglideMessages() {
  mock.module("@/paraglide/messages.js", () => ({
    m: new Proxy(
      {},
      {
        get: (_t, prop) => (args?: Record<string, string>) => {
          if (prop === "query_rate_limit") return `Rate limited: ${args?.seconds}s`;
          if (prop === "query_request_failed_status") return `Request failed: ${args?.status}`;
          return "stub";
        },
      },
    ),
  }));
}

export function mockApiUrl() {
  mock.module("@/lib/api", () => ({ API_URL: "http://test-api" }));
}

const originalFetch = globalThis.fetch;

export function mockFetch(impl: () => Promise<Response>) {
  const fn = mock(impl);
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

export function restoreFetchAfterEach() {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });
}

export function createWrapper(opts?: { mutations?: boolean }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      ...(opts?.mutations && { mutations: { retry: false } }),
    },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}
