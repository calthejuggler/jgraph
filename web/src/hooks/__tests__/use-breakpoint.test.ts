import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { useIsDesktop } from "../use-breakpoint";

describe("useIsDesktop", () => {
  test("returns true in happy-dom (viewport defaults to 1024px)", () => {
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);
  });
});
