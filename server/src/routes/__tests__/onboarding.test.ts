import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

import { authed, mockDb, resetMocks, unauthed } from "./helpers";

const { loggingPlugin } = await import("../../lib/logging");
const { onboardingRoute } = await import("../v1/onboarding");

const app = new Elysia().use(loggingPlugin).use(onboardingRoute);

function chainMock({ fail = false } = {}) {
  const chain = {
    set: () => chain,
    where: () => (fail ? Promise.reject(new Error("DB error")) : Promise.resolve()),
  };
  mockDb.update.mockReturnValue(chain);
}

beforeEach(resetMocks);

describe("POST /onboarding/state-graph/complete", () => {
  it("returns 401 when not authenticated", async () => {
    unauthed();
    const res = await app.handle(
      new Request("http://localhost/onboarding/state-graph/complete", { method: "POST" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns success when authenticated", async () => {
    authed();
    chainMock();
    const res = await app.handle(
      new Request("http://localhost/onboarding/state-graph/complete", { method: "POST" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 500 when db update fails", async () => {
    authed();
    chainMock({ fail: true });
    const res = await app.handle(
      new Request("http://localhost/onboarding/state-graph/complete", { method: "POST" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to update onboarding status");
  });
});
