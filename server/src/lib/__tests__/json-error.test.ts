import { describe, expect, it } from "bun:test";

import { jsonError } from "../json-error";

describe("jsonError", () => {
  it("returns a Response with the given status code", () => {
    const res = jsonError(404, "Not found");
    expect(res.status).toBe(404);
  });

  it("returns JSON body with error message", async () => {
    const res = jsonError(400, "Bad request");
    const body = await res.json();
    expect(body).toEqual({ error: "Bad request" });
  });

  it("sets Content-Type to application/json", () => {
    const res = jsonError(500, "Internal error");
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });
});
