import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { WideEvent } from "../logging";

const getSessionMock = mock();

mock.module("../auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

const { requireSession } = await import("../require-auth");

function makeWideEvent(): WideEvent {
  return {};
}

describe("requireSession", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
  });

  it("returns ok:true with session when authenticated", async () => {
    const session = { user: { id: "u-1", role: "admin" } };
    getSessionMock.mockResolvedValue(session);

    const result = await requireSession(new Request("http://localhost"), makeWideEvent());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.user.id).toBe("u-1");
      expect(result.session.user.role).toBe("admin");
    }
  });

  it("returns ok:false with 401 when no session", async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await requireSession(new Request("http://localhost"), makeWideEvent());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json();
      expect(body).toEqual({ error: "Unauthorized" });
    }
  });

  it("sets wideEvent.user_id and user_role on success", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "u-2", role: "editor" } });

    const wideEvent = makeWideEvent();
    await requireSession(new Request("http://localhost"), wideEvent);
    expect(wideEvent.user_id).toBe("u-2");
    expect(wideEvent.user_role).toBe("editor");
  });

  it("sets wideEvent.user_role to undefined when role is null", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "u-3", role: null } });

    const wideEvent = makeWideEvent();
    await requireSession(new Request("http://localhost"), wideEvent);
    expect(wideEvent.user_id).toBe("u-3");
    expect(wideEvent.user_role).toBeUndefined();
  });

  it("sets wideEvent.error_message on failure", async () => {
    getSessionMock.mockResolvedValue(null);

    const wideEvent = makeWideEvent();
    await requireSession(new Request("http://localhost"), wideEvent);
    expect(wideEvent.error_message).toBe("Unauthorized");
  });
});
