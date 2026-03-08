import { describe, expect, it } from "bun:test";

import { resetPasswordTemplate, verifyEmailTemplate } from "../email-templates";

describe("resetPasswordTemplate", () => {
  it("includes the reset URL in both the button and plaintext fallback", () => {
    const html = resetPasswordTemplate("https://example.com/reset?token=abc123");
    expect(html).toContain('href="https://example.com/reset?token=abc123"');
    expect(html).toContain("https://example.com/reset?token=abc123");
  });

  it("includes the heading", () => {
    const html = resetPasswordTemplate("https://example.com/reset");
    expect(html).toContain("Reset your password");
  });

  it("escapes HTML entities in the URL to prevent injection", () => {
    const html = resetPasswordTemplate('https://evil.com"><script>alert(1)</script>');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("verifyEmailTemplate", () => {
  it("includes the verification URL", () => {
    const html = verifyEmailTemplate("https://example.com/verify?token=xyz");
    expect(html).toContain("https://example.com/verify?token=xyz");
  });

  it("includes the heading", () => {
    const html = verifyEmailTemplate("https://example.com/verify");
    expect(html).toContain("Verify your email");
  });

  it("escapes HTML entities in the URL to prevent injection", () => {
    const html = verifyEmailTemplate('https://evil.com"><img src=x onerror=alert(1)>');
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
