import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { createSimulator } from "../simulator.js";

const createMockCanvas = (width = 400, height = 600) => {
  const ctx = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "canvas") return canvas;
        return (..._args: unknown[]) => {};
      },
      set() {
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;

  const canvas = {
    width,
    height,
    getContext: (_type: string) => ctx,
  } as unknown as HTMLCanvasElement;

  return canvas;
};

// Mock browser globals
const originalRAF = globalThis.requestAnimationFrame;
const originalCAF = globalThis.cancelAnimationFrame;
const originalPerf = globalThis.performance;

beforeEach(() => {
  let frameId = 0;
  globalThis.requestAnimationFrame = mock((_cb: FrameRequestCallback) => ++frameId);
  globalThis.cancelAnimationFrame = mock((_id: number) => {});
  globalThis.performance = { now: () => 0 } as Performance;
});

afterEach(() => {
  globalThis.requestAnimationFrame = originalRAF;
  globalThis.cancelAnimationFrame = originalCAF;
  globalThis.performance = originalPerf;
});

describe("createSimulator", () => {
  test("returns object with all expected methods", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });

    expect(typeof sim.start).toBe("function");
    expect(typeof sim.stop).toBe("function");
    expect(typeof sim.setSiteswap).toBe("function");
    expect(typeof sim.setNumHands).toBe("function");
    expect(typeof sim.setBeatDuration).toBe("function");
    expect(typeof sim.setDwellRatio).toBe("function");
    expect(typeof sim.setArcPeakPosition).toBe("function");
    expect(typeof sim.setColors).toBe("function");
    expect(typeof sim.setBackground).toBe("function");
    expect(typeof sim.setForeground).toBe("function");
    expect(typeof sim.setShowJuggler).toBe("function");
    expect(typeof sim.setRender).toBe("function");
    expect(typeof sim.resize).toBe("function");
    expect(typeof sim.setThrowHolds).toBe("function");
    expect(typeof sim.setThrowValues).toBe("function");
    expect(typeof sim.setLoopBeats).toBe("function");
  });

  test("works with minimal options", () => {
    const canvas = createMockCanvas();
    expect(() => createSimulator(canvas, { siteswap: "3" })).not.toThrow();
  });

  test("works with all options specified", () => {
    const canvas = createMockCanvas();
    expect(() =>
      createSimulator(canvas, {
        siteswap: "531",
        numHands: 2,
        beatDuration: 400,
        dwellRatio: 0.5,
        arcPeakPosition: 0.6,
        colors: ["red", "blue"],
        background: "#000",
        foreground: "white",
        showJuggler: false,
        throwHolds: true,
      }),
    ).not.toThrow();
  });

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

describe("setter smoke tests", () => {
  test("setSiteswap does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setSiteswap("531")).not.toThrow();
  });

  test("setNumHands does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setNumHands(3)).not.toThrow();
  });

  test("setBeatDuration does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setBeatDuration(400)).not.toThrow();
  });

  test("setDwellRatio does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setDwellRatio(0.5)).not.toThrow();
  });

  test("setArcPeakPosition does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setArcPeakPosition(0.6)).not.toThrow();
  });

  test("setColors does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setColors(["red", "blue"])).not.toThrow();
  });

  test("setBackground does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setBackground("#000")).not.toThrow();
  });

  test("setForeground does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setForeground("white")).not.toThrow();
  });

  test("setShowJuggler does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setShowJuggler(false)).not.toThrow();
  });

  test("setRender does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setRender(() => {})).not.toThrow();
    expect(() => sim.setRender(undefined)).not.toThrow();
  });

  test("resize does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.resize()).not.toThrow();
  });

  test("setThrowHolds does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setThrowHolds(true)).not.toThrow();
  });

  test("setThrowValues does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setThrowValues([5, 3, 1], 3)).not.toThrow();
  });

  test("setLoopBeats does not throw", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    expect(() => sim.setLoopBeats(6)).not.toThrow();
    expect(() => sim.setLoopBeats(undefined)).not.toThrow();
  });
});
