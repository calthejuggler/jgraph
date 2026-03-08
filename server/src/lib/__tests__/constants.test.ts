import { describe, expect, it } from "bun:test";

import { ENGINE_URL, MAX_MAX_HEIGHT, SCHEMA_VERSION } from "../constants";

describe("constants", () => {
  it("MAX_MAX_HEIGHT defaults to 32", () => {
    expect(MAX_MAX_HEIGHT).toBe(32);
  });

  it("ENGINE_URL defaults to http://localhost:8000", () => {
    expect(ENGINE_URL).toBe("http://localhost:8000");
  });

  it("SCHEMA_VERSION defaults to '1'", () => {
    expect(SCHEMA_VERSION).toBe("1");
  });
});
