import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

import { authed, authedAdmin, mockDb, resetMocks, unauthed } from "./helpers";

const { loggingPlugin } = await import("../../lib/logging");
const { adminRoutes } = await import("../v1/admin");

const app = new Elysia().use(loggingPlugin).use(adminRoutes);

const mockUsers = [
  { id: "u1", name: "Alice", email: "alice@test.com", lastLoginAt: null },
  { id: "u2", name: "Bob", email: "bob@test.com", lastLoginAt: null },
];

function dbReturnsUsers(rows: object[] = mockUsers, total = rows.length) {
  const selectChain = {
    from: () => selectChain,
    leftJoin: () => selectChain,
    where: () => selectChain,
    orderBy: () => selectChain,
    limit: () => selectChain,
    offset: () => Promise.resolve(rows),
  };
  const countChain = {
    from: () => countChain,
    where: () => Promise.resolve([{ total }]),
  };
  const subSelectChain = {
    from: () => subSelectChain,
    groupBy: () => ({
      as: () => ({ lastLoginAt: null, userId: null }),
    }),
  };
  let selectCallCount = 0;
  mockDb.select.mockImplementation(() => {
    selectCallCount++;
    if (selectCallCount === 1) return subSelectChain;
    if (selectCallCount === 2) return selectChain;
    return countChain;
  });
}

beforeEach(resetMocks);

describe("GET /admin/users", () => {
  it("returns 401 when not authenticated", async () => {
    unauthed();
    const res = await app.handle(new Request("http://localhost/admin/users"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated but not admin", async () => {
    authed();
    const res = await app.handle(new Request("http://localhost/admin/users"));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Forbidden");
  });

  it("returns users when admin", async () => {
    authedAdmin();
    dbReturnsUsers();
    const res = await app.handle(new Request("http://localhost/admin/users"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.users).toHaveLength(2);
    expect(body.total).toBe(2);
  });
});
