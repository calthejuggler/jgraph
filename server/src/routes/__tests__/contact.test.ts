import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

import { mockSendEmail, resetMocks } from "./helpers";

const { loggingPlugin } = await import("../../lib/logging");
const { contactRoute } = await import("../v1/contact");

const app = new Elysia().use(loggingPlugin).use(contactRoute);

function postContact(body: object) {
  return app.handle(
    new Request("http://localhost/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const validBody = { name: "Alice", email: "alice@example.com", message: "Hello there" };

beforeEach(resetMocks);

describe("POST /contact", () => {
  it("sends email and returns success", async () => {
    mockSendEmail.mockResolvedValue(undefined);
    const res = await postContact(validBody);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when email sending fails", async () => {
    mockSendEmail.mockRejectedValue(new Error("SMTP error"));
    const res = await postContact(validBody);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to send message");
  });

  it("passes correct email data", async () => {
    mockSendEmail.mockResolvedValue(undefined);
    await postContact({ name: "<b>Bob</b>", email: "bob@example.com", message: "Line1\nLine2" });

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.to).toBe("calthejuggler@gmail.com");
    expect(call.subject).toContain("Feedback from <b>Bob</b>");
    expect(call.html).toContain("&lt;b&gt;Bob&lt;/b&gt;");
    expect(call.html).toContain("<br />");
  });
});
