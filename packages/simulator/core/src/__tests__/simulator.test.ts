import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { createSimulator } from "../simulator.js";

const createMockCanvas = (width = 400, height = 600) => {
  const ctx = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "canvas") return canvas;
        return () => {};
      },
      set() {
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;

  const canvas = {
    width,
    height,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;

  return canvas;
};

const originalRAF = globalThis.requestAnimationFrame;
const originalCAF = globalThis.cancelAnimationFrame;
const originalPerf = globalThis.performance;

beforeEach(() => {
  let frameId = 0;
  globalThis.requestAnimationFrame = mock(() => ++frameId);
  globalThis.cancelAnimationFrame = mock(() => {});
  globalThis.performance = { now: () => 0 } as Performance;
});

afterEach(() => {
  globalThis.requestAnimationFrame = originalRAF;
  globalThis.cancelAnimationFrame = originalCAF;
  globalThis.performance = originalPerf;
});

describe("createSimulator", () => {
  test("start calls requestAnimationFrame", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.start();
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
  });

  test("stop calls cancelAnimationFrame", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.start();
    sim.stop();
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
  });

  test("start is idempotent (no-op if already running)", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.start();
    sim.start();
    const callCount = (globalThis.requestAnimationFrame as ReturnType<typeof mock>).mock.calls
      .length;
    expect(callCount).toBe(1);
  });
});
