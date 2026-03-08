import { describe, expect, test } from "bun:test";

import { toSiteswapChar } from "../siteswap-notation";

describe("toSiteswapChar", () => {
  test("single-digit values stay as digits", () => {
    expect(toSiteswapChar(0)).toBe("0");
    expect(toSiteswapChar(5)).toBe("5");
    expect(toSiteswapChar(9)).toBe("9");
  });

  test("10+ become lowercase letters", () => {
    expect(toSiteswapChar(10)).toBe("a");
    expect(toSiteswapChar(11)).toBe("b");
    expect(toSiteswapChar(15)).toBe("f");
    expect(toSiteswapChar(35)).toBe("z");
  });

  test("values above 35 are wrapped in curly braces", () => {
    expect(toSiteswapChar(36)).toBe("{36}");
    expect(toSiteswapChar(128)).toBe("{128}");
  });
});
