import { describe, expect, mock, test } from "bun:test";

mock.module("@/paraglide/messages.js", () => ({
  m: {
    validation_invalid_email: () => "Invalid email",
    validation_password_required: () => "Password required",
    validation_name_required: () => "Name required",
    validation_password_min: () => "Password too short",
    validation_passwords_must_match: () => "Passwords must match",
    validation_max_height: () => "Max height must be >= num props",
    contact_validation_message_required: () => "Message required",
  },
}));

const {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  graphsSchema,
  contactSchema,
} = await import("../schemas");

describe("loginSchema", () => {
  const schema = loginSchema();

  test("accepts valid data", () => {
    expect(schema.safeParse({ email: "a@b.com", password: "pass" }).success).toBe(true);
  });

  test("rejects invalid email", () => {
    expect(schema.safeParse({ email: "not-email", password: "pass" }).success).toBe(false);
  });

  test("rejects empty password", () => {
    expect(schema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("signupSchema", () => {
  const schema = signupSchema();

  test("accepts valid data", () => {
    const result = schema.safeParse({ name: "Cal", email: "a@b.com", password: "12345678" });
    expect(result.success).toBe(true);
  });

  test("rejects short password", () => {
    const result = schema.safeParse({ name: "Cal", email: "a@b.com", password: "short" });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  const schema = forgotPasswordSchema();

  test("accepts valid email", () => {
    expect(schema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  test("rejects invalid email", () => {
    expect(schema.safeParse({ email: "not-email" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const schema = resetPasswordSchema();

  test("accepts matching passwords", () => {
    const result = schema.safeParse({ password: "12345678", confirmPassword: "12345678" });
    expect(result.success).toBe(true);
  });

  test("rejects mismatched passwords", () => {
    const result = schema.safeParse({ password: "12345678", confirmPassword: "different" });
    expect(result.success).toBe(false);
  });

  test("rejects short passwords", () => {
    const result = schema.safeParse({ password: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const schema = changePasswordSchema();

  test("accepts valid data with matching passwords", () => {
    const result = schema.safeParse({
      currentPassword: "oldpass",
      newPassword: "12345678",
      confirmPassword: "12345678",
    });
    expect(result.success).toBe(true);
  });

  test("rejects mismatched new passwords", () => {
    const result = schema.safeParse({
      currentPassword: "oldpass",
      newPassword: "12345678",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty current password", () => {
    const result = schema.safeParse({
      currentPassword: "",
      newPassword: "12345678",
      confirmPassword: "12345678",
    });
    expect(result.success).toBe(false);
  });

  test("rejects short new password", () => {
    const result = schema.safeParse({
      currentPassword: "oldpass",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("graphsSchema", () => {
  const schema = graphsSchema();

  test("accepts valid data", () => {
    expect(schema.safeParse({ num_props: 3, max_height: 5 }).success).toBe(true);
  });

  test("rejects max_height < num_props", () => {
    expect(schema.safeParse({ num_props: 5, max_height: 3 }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  const schema = contactSchema();

  test("accepts valid data", () => {
    const result = schema.safeParse({ name: "Cal", email: "a@b.com", message: "Hello" });
    expect(result.success).toBe(true);
  });

  test("rejects empty name", () => {
    const result = schema.safeParse({ name: "", email: "a@b.com", message: "Hello" });
    expect(result.success).toBe(false);
  });

  test("rejects message too long", () => {
    const result = schema.safeParse({ name: "Cal", email: "a@b.com", message: "x".repeat(5001) });
    expect(result.success).toBe(false);
  });
});
