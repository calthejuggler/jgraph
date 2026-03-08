import { describe, expect, test } from "bun:test";

import { HttpError } from "../http-error";

describe("HttpError", () => {
  test("stores status and message", () => {
    const error = new HttpError(404, "Not found");
    expect(error.status).toBe(404);
    expect(error.message).toBe("Not found");
  });

  test("is an instance of Error", () => {
    expect(new HttpError(500, "Internal")).toBeInstanceOf(Error);
  });
});
