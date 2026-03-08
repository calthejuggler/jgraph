import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "bun:test";

import { useSimulatorContext } from "../context.js";

describe("useSimulatorContext", () => {
  it("throws when used outside a Provider", () => {
    expect(() => renderHook(() => useSimulatorContext())).toThrow(
      "useSimulator must be used within a <Simulator.Root>",
    );
  });
});
