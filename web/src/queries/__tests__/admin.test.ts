import { useQuery } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

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

type MockResult = Promise<{ data: unknown; error: { message?: string } | null }>;

const mockAuthClient = {
  admin: {
    listUserSessions: mock((): MockResult => Promise.resolve({ data: [], error: null })),
    banUser: mock((): MockResult => Promise.resolve({ data: { user: {} }, error: null })),
    unbanUser: mock((): MockResult => Promise.resolve({ data: { user: {} }, error: null })),
    setRole: mock((): MockResult => Promise.resolve({ data: { user: {} }, error: null })),
    impersonateUser: mock((): MockResult => Promise.resolve({ data: {}, error: null })),
    stopImpersonating: mock((): MockResult => Promise.resolve({ data: {}, error: null })),
    revokeUserSession: mock((): MockResult => Promise.resolve({ data: {}, error: null })),
    revokeUserSessions: mock((): MockResult => Promise.resolve({ data: {}, error: null })),
    removeUser: mock((): MockResult => Promise.resolve({ data: { user: {} }, error: null })),
  },
};

mock.module("@/lib/auth-client", () => ({
  authClient: mockAuthClient,
}));

function resetAuthMocks() {
  for (const fn of Object.values(mockAuthClient.admin)) {
    fn.mockReset();
  }
  mockAuthClient.admin.listUserSessions.mockImplementation(() =>
    Promise.resolve({ data: [], error: null }),
  );
  mockAuthClient.admin.banUser.mockImplementation(() =>
    Promise.resolve({ data: { user: {} }, error: null }),
  );
  mockAuthClient.admin.unbanUser.mockImplementation(() =>
    Promise.resolve({ data: { user: {} }, error: null }),
  );
  mockAuthClient.admin.setRole.mockImplementation(() =>
    Promise.resolve({ data: { user: {} }, error: null }),
  );
  mockAuthClient.admin.impersonateUser.mockImplementation(() =>
    Promise.resolve({ data: {}, error: null }),
  );
  mockAuthClient.admin.stopImpersonating.mockImplementation(() =>
    Promise.resolve({ data: {}, error: null }),
  );
  mockAuthClient.admin.revokeUserSession.mockImplementation(() =>
    Promise.resolve({ data: {}, error: null }),
  );
  mockAuthClient.admin.revokeUserSessions.mockImplementation(() =>
    Promise.resolve({ data: {}, error: null }),
  );
  mockAuthClient.admin.removeUser.mockImplementation(() =>
    Promise.resolve({ data: { user: {} }, error: null }),
  );
}

describe("adminQueries.userList", () => {
  it("constructs URLSearchParams with limit, offset, sortBy, sortDirection", async () => {
    const fn = mockFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ users: [], total: 0 }), { status: 200 })),
    );

    const { adminQueries } = await import("../admin");
    const opts = adminQueries.userList({
      page: 2,
      sortBy: "name",
      sortDirection: "asc",
    });
    renderHook(() => useQuery(opts), { wrapper: createWrapper() });

    await waitFor(() => expect(fn).toHaveBeenCalled());
    const [url] = fn.mock.calls[0] as unknown as [string];
    expect(url).toContain("limit=20");
    expect(url).toContain("offset=20");
    expect(url).toContain("sortBy=name");
    expect(url).toContain("sortDirection=asc");
  });

  it("includes search param when provided", async () => {
    const fn = mockFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ users: [], total: 0 }), { status: 200 })),
    );

    const { adminQueries } = await import("../admin");
    const opts = adminQueries.userList({
      page: 1,
      sortBy: "createdAt",
      sortDirection: "desc",
      search: "john",
    });
    renderHook(() => useQuery(opts), { wrapper: createWrapper() });

    await waitFor(() => expect(fn).toHaveBeenCalled());
    const [url] = fn.mock.calls[0] as unknown as [string];
    expect(url).toContain("search=john");
  });

  it("omits search param when empty", async () => {
    const fn = mockFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ users: [], total: 0 }), { status: 200 })),
    );

    const { adminQueries } = await import("../admin");
    const opts = adminQueries.userList({
      page: 1,
      sortBy: "createdAt",
      sortDirection: "desc",
      search: "",
    });
    renderHook(() => useQuery(opts), { wrapper: createWrapper() });

    await waitFor(() => expect(fn).toHaveBeenCalled());
    const [url] = fn.mock.calls[0] as unknown as [string];
    expect(url).not.toContain("search=");
  });

  it("throws on non-ok response", async () => {
    mockFetch(() => Promise.resolve(new Response("", { status: 500 })));

    const { adminQueries } = await import("../admin");
    const opts = adminQueries.userList({
      page: 1,
      sortBy: "createdAt",
      sortDirection: "desc",
    });
    const { result } = renderHook(() => useQuery(opts), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe("adminQueries.userSessions", () => {
  beforeEach(resetAuthMocks);

  it("delegates to authClient.admin.listUserSessions", async () => {
    const sessions = [{ id: "s1", token: "t1" }];
    mockAuthClient.admin.listUserSessions.mockImplementation(() =>
      Promise.resolve({ data: sessions, error: null }),
    );

    const { adminQueries } = await import("../admin");
    const opts = adminQueries.userSessions("user-1");
    const { result } = renderHook(() => useQuery(opts), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data as unknown).toEqual(sessions);
    expect(mockAuthClient.admin.listUserSessions).toHaveBeenCalledWith({ userId: "user-1" });
  });

  it("throws on error response", async () => {
    mockAuthClient.admin.listUserSessions.mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: "Not found" } }),
    );

    const { adminQueries } = await import("../admin");
    const opts = adminQueries.userSessions("user-1");
    const { result } = renderHook(() => useQuery(opts), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toBe("Not found");
  });

  it("throws with fallback message when error.message is undefined", async () => {
    mockAuthClient.admin.listUserSessions.mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: undefined } }),
    );

    const { adminQueries } = await import("../admin");
    const opts = adminQueries.userSessions("user-1");
    const { result } = renderHook(() => useQuery(opts), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toBe("stub");
  });
});

describe("admin mutations", () => {
  beforeEach(resetAuthMocks);

  it("useBanUser calls authClient.admin.banUser", async () => {
    const { useBanUser } = await import("../admin");
    const { result } = renderHook(() => useBanUser(), {
      wrapper: createWrapper({ mutations: true }),
    });

    result.current.mutate({ userId: "u1", banReason: "spam" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAuthClient.admin.banUser).toHaveBeenCalledWith({
      userId: "u1",
      banReason: "spam",
    });
  });

  it("useBanUser throws on error", async () => {
    mockAuthClient.admin.banUser.mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: "Forbidden" } }),
    );

    const { useBanUser } = await import("../admin");
    const { result } = renderHook(() => useBanUser(), {
      wrapper: createWrapper({ mutations: true }),
    });

    result.current.mutate({ userId: "u1" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error!.message).toBe("Forbidden");
  });

  it("useUnbanUser calls authClient.admin.unbanUser", async () => {
    const { useUnbanUser } = await import("../admin");
    const { result } = renderHook(() => useUnbanUser(), {
      wrapper: createWrapper({ mutations: true }),
    });

    result.current.mutate("u2");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAuthClient.admin.unbanUser).toHaveBeenCalledWith({ userId: "u2" });
  });

  it("useSetRole calls authClient.admin.setRole", async () => {
    const { useSetRole } = await import("../admin");
    const { result } = renderHook(() => useSetRole(), {
      wrapper: createWrapper({ mutations: true }),
    });

    result.current.mutate({ userId: "u3", role: "admin" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAuthClient.admin.setRole).toHaveBeenCalledWith({
      userId: "u3",
      role: "admin",
    });
  });

  it("useRevokeSession calls authClient.admin.revokeUserSession", async () => {
    const { useRevokeSession } = await import("../admin");
    const { result } = renderHook(() => useRevokeSession(), {
      wrapper: createWrapper({ mutations: true }),
    });

    result.current.mutate({ sessionToken: "tok1", userId: "u1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAuthClient.admin.revokeUserSession).toHaveBeenCalledWith({
      sessionToken: "tok1",
    });
  });

  it("useRevokeAllSessions calls authClient.admin.revokeUserSessions", async () => {
    const { useRevokeAllSessions } = await import("../admin");
    const { result } = renderHook(() => useRevokeAllSessions(), {
      wrapper: createWrapper({ mutations: true }),
    });

    result.current.mutate("u4");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAuthClient.admin.revokeUserSessions).toHaveBeenCalledWith({ userId: "u4" });
  });

  it("useRemoveUser calls authClient.admin.removeUser", async () => {
    const { useRemoveUser } = await import("../admin");
    const { result } = renderHook(() => useRemoveUser(), {
      wrapper: createWrapper({ mutations: true }),
    });

    result.current.mutate("u5");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAuthClient.admin.removeUser).toHaveBeenCalledWith({ userId: "u5" });
  });

  describe("location-redirecting mutations", () => {
    const originalLocation = window.location;
    let assignMock: ReturnType<typeof mock>;

    beforeEach(() => {
      assignMock = mock(() => {});
      Object.defineProperty(window, "location", {
        value: { assign: assignMock },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, "location", {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it("useImpersonateUser calls authClient.admin.impersonateUser", async () => {
      const { useImpersonateUser } = await import("../admin");
      const { result } = renderHook(() => useImpersonateUser(), {
        wrapper: createWrapper({ mutations: true }),
      });

      result.current.mutate("u6");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockAuthClient.admin.impersonateUser).toHaveBeenCalledWith({ userId: "u6" });
      expect(assignMock).toHaveBeenCalledWith("/");
    });

    it("useImpersonateUser throws on error", async () => {
      mockAuthClient.admin.impersonateUser.mockImplementation(() =>
        Promise.resolve({ data: null, error: { message: "Forbidden" } }),
      );

      const { useImpersonateUser } = await import("../admin");
      const { result } = renderHook(() => useImpersonateUser(), {
        wrapper: createWrapper({ mutations: true }),
      });

      result.current.mutate("u6");

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error!.message).toBe("Forbidden");
    });

    it("useStopImpersonating calls authClient.admin.stopImpersonating", async () => {
      const { useStopImpersonating } = await import("../admin");
      const { result } = renderHook(() => useStopImpersonating(), {
        wrapper: createWrapper({ mutations: true }),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockAuthClient.admin.stopImpersonating).toHaveBeenCalled();
      expect(assignMock).toHaveBeenCalledWith("/admin");
    });

    it("useStopImpersonating throws on error", async () => {
      mockAuthClient.admin.stopImpersonating.mockImplementation(() =>
        Promise.resolve({ data: null, error: { message: "Failed" } }),
      );

      const { useStopImpersonating } = await import("../admin");
      const { result } = renderHook(() => useStopImpersonating(), {
        wrapper: createWrapper({ mutations: true }),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error!.message).toBe("Failed");
    });
  });
});
