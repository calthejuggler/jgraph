import { describe, expect, it } from "bun:test";

import { HttpError } from "../http-error";
import { queryClient } from "../query-client";

const retry = queryClient.getDefaultOptions().queries!.retry as (
  failureCount: number,
  error: Error,
) => boolean;

describe("queryClient retry", () => {
  it("retries generic errors up to 3 times", () => {
    const err = new Error("network failure");
    expect(retry(0, err)).toBe(true);
    expect(retry(1, err)).toBe(true);
    expect(retry(2, err)).toBe(true);
    expect(retry(3, err)).toBe(false);
  });

  it("does not retry 4xx HttpErrors", () => {
    expect(retry(0, new HttpError(400, "bad request"))).toBe(false);
    expect(retry(0, new HttpError(401, "unauthorized"))).toBe(false);
    expect(retry(0, new HttpError(404, "not found"))).toBe(false);
    expect(retry(0, new HttpError(429, "rate limited"))).toBe(false);
    expect(retry(0, new HttpError(499, "client closed"))).toBe(false);
  });

  it("retries 5xx HttpErrors", () => {
    expect(retry(0, new HttpError(500, "internal error"))).toBe(true);
    expect(retry(0, new HttpError(502, "bad gateway"))).toBe(true);
    expect(retry(0, new HttpError(503, "service unavailable"))).toBe(true);
  });

  it("stops retrying 5xx after 3 failures", () => {
    const err = new HttpError(500, "internal error");
    expect(retry(2, err)).toBe(true);
    expect(retry(3, err)).toBe(false);
  });
});
