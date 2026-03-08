import type { ReactNode } from "react";

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "bun:test";

import { Root } from "../root.js";
import { useSimulator } from "../use-simulator.js";
import { resetActiveMock, setupSimulatorMock } from "./helpers.js";

setupSimulatorMock();

const wrapper = ({ children }: { children: ReactNode }) => <Root siteswap="3">{children}</Root>;

beforeEach(resetActiveMock);

describe("useSimulator", () => {
  test("throws when used outside of Simulator.Root", () => {
    const originalError = console.error;
    console.error = () => {};
    try {
      expect(() => renderHook(() => useSimulator())).toThrow(
        "useSimulator must be used within a <Simulator.Root>",
      );
    } finally {
      console.error = originalError;
    }
  });

  test("returns siteswap from Root", () => {
    const { result } = renderHook(() => useSimulator(), { wrapper });
    expect(result.current.siteswap).toBe("3");
  });

  test("returns control functions", () => {
    const { result } = renderHook(() => useSimulator(), { wrapper });
    expect(typeof result.current.setSiteswap).toBe("function");
    expect(typeof result.current.start).toBe("function");
    expect(typeof result.current.stop).toBe("function");
  });

  test("returns isRunning state", () => {
    const { result } = renderHook(() => useSimulator(), { wrapper });
    expect(typeof result.current.isRunning).toBe("boolean");
  });

  test("returns error state", () => {
    const { result } = renderHook(() => useSimulator(), { wrapper });
    expect(result.current.error).toBeNull();
  });
});
