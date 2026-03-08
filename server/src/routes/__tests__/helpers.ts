import { mock } from "bun:test";
import { Elysia } from "elysia";

export const mockRequireSession = mock();
export const mockFetchEngine = mock();

mock.module("../../lib/require-auth", () => ({
  requireSession: mockRequireSession,
}));

mock.module("../../lib/engine", () => ({
  fetchEngine: mockFetchEngine,
}));

mock.module("../../lib/rate-limit", () => ({
  graphRateLimit: new Elysia(),
}));

export function authed() {
  mockRequireSession.mockResolvedValue({
    ok: true,
    session: { user: { id: "u1", role: "user" } },
  });
}

export function unauthed() {
  mockRequireSession.mockResolvedValue({
    ok: false,
    response: new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
  });
}

export function engineReturns(body: object) {
  mockFetchEngine.mockResolvedValue({
    ok: true,
    response: new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
    }),
  });
}

export function engineUnavailable() {
  mockFetchEngine.mockResolvedValue({
    ok: false,
    response: new Response(JSON.stringify({ error: "Engine unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }),
  });
}

export function resetMocks() {
  mockRequireSession.mockReset();
  mockFetchEngine.mockReset();
}
