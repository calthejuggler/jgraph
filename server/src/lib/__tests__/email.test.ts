import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const mockSend = mock(() => Promise.resolve({ error: null as { message: string } | null }));

mock.module("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

const mockLogger = { error: mock(() => {}), info: mock(() => {}) };
mock.module("../logger", () => ({ logger: mockLogger }));

describe("sendEmail", () => {
  const originalEnv = { ...Bun.env };

  beforeEach(() => {
    Bun.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockReset();
    mockSend.mockImplementation(() => Promise.resolve({ error: null }));
    mockLogger.error.mockReset();
  });

  afterEach(() => {
    Object.assign(Bun.env, originalEnv);
  });

  async function importFresh() {
    const mod = await import("../email");
    return mod.sendEmail;
  }

  it("calls resend.emails.send with correct arguments", async () => {
    const sendEmail = await importFresh();
    await sendEmail({ to: "user@test.com", subject: "Hello", html: "<p>Hi</p>" });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        subject: "Hello",
        html: "<p>Hi</p>",
        from: expect.stringContaining("Juggling Tools"),
      }),
    );
  });

  it("resolves without error on success", async () => {
    const sendEmail = await importFresh();
    const result = await sendEmail({ to: "user@test.com", subject: "Test", html: "<p>Ok</p>" });
    expect(result).toBeUndefined();
  });

  it("throws with error message on Resend error", async () => {
    mockSend.mockImplementation(() => Promise.resolve({ error: { message: "Invalid API key" } }));

    const sendEmail = await importFresh();
    let thrown: Error | undefined;
    try {
      await sendEmail({ to: "user@test.com", subject: "Test", html: "<p>Hi</p>" });
    } catch (e) {
      thrown = e as Error;
    }
    expect(thrown?.message).toBe("Failed to send email: Invalid API key");
  });

  it("logs error event on failure", async () => {
    mockSend.mockImplementation(() => Promise.resolve({ error: { message: "Rate limited" } }));

    const sendEmail = await importFresh();
    try {
      await sendEmail({ to: "user@test.com", subject: "Fail", html: "<p>X</p>" });
    } catch {
      // expected to throw
    }

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "email_send_failed",
        to: "user@test.com",
        subject: "Fail",
        error: "Rate limited",
      }),
    );
  });
});
