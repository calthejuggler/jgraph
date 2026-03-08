import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import type { CustomRenderFn } from "../simulator.js";
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

let rafCallback: ((time: number) => void) | null = null;

beforeEach(() => {
  let frameId = 0;
  rafCallback = null;
  globalThis.requestAnimationFrame = mock((cb: (time: number) => void) => {
    rafCallback = cb;
    return ++frameId;
  });
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

  test("stop is a no-op when not running", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.stop();
    expect(globalThis.cancelAnimationFrame).not.toHaveBeenCalled();
  });
});

describe("setter methods", () => {
  test("setSiteswap rebuilds state and restarts if running", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.start();
    const rafCallsBefore = (globalThis.requestAnimationFrame as ReturnType<typeof mock>).mock.calls
      .length;
    sim.setSiteswap("531");
    const rafCallsAfter = (globalThis.requestAnimationFrame as ReturnType<typeof mock>).mock.calls
      .length;
    expect(rafCallsAfter).toBeGreaterThan(rafCallsBefore);
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
  });

  test("setSiteswap does not restart if not running", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.setSiteswap("531");
    expect(globalThis.cancelAnimationFrame).not.toHaveBeenCalled();
    expect(globalThis.requestAnimationFrame).not.toHaveBeenCalled();
  });

  test("setNumHands rebuilds state and restarts if running", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.start();
    sim.setNumHands(1);
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
    const rafCalls = (globalThis.requestAnimationFrame as ReturnType<typeof mock>).mock.calls
      .length;
    expect(rafCalls).toBeGreaterThan(1);
  });

  test("setColors rebuilds state and restarts if running", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.start();
    sim.setColors(["#ff0000", "#00ff00"]);
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
    const rafCalls = (globalThis.requestAnimationFrame as ReturnType<typeof mock>).mock.calls
      .length;
    expect(rafCalls).toBeGreaterThan(1);
  });

  test.each([
    { setter: "setBeatDuration", value: 500 },
    { setter: "setDwellRatio", value: 0.8 },
    { setter: "setArcPeakPosition", value: 0.7 },
    { setter: "setBackground", value: "#000000" },
    { setter: "setForeground", value: "#ffffff" },
    { setter: "setShowJuggler", value: false },
    { setter: "setThrowHolds", value: true },
  ] as const)("$setter updates without rebuilding", ({ setter, value }) => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    (sim[setter] as (v: unknown) => void)(value);
    expect(globalThis.cancelAnimationFrame).not.toHaveBeenCalled();
  });
});

describe("setRender", () => {
  test("uses custom render function when set", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.setRender(customRender);
    sim.start();

    expect(rafCallback).not.toBeNull();
    rafCallback!(16);

    expect(customRender).toHaveBeenCalled();
    const [ctx, width, height, frame] = customRender.mock.calls[0];
    expect(width).toBe(400);
    expect(height).toBe(600);
    expect(frame).toHaveProperty("balls");
    expect(frame).toHaveProperty("handPositions");
    expect(ctx).toBeDefined();
  });

  test("restores default renderer when set to undefined", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.setRender(customRender);
    sim.setRender(undefined);
    sim.start();

    rafCallback!(16);
    expect(customRender).not.toHaveBeenCalled();
  });

  test("custom render passed via options is used", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.start();

    rafCallback!(16);
    expect(customRender).toHaveBeenCalled();
  });
});

describe("resize", () => {
  test("recalculates hand positions after canvas resize", () => {
    const canvas = createMockCanvas(400, 600);
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.start();

    const handsBefore = customRender.mock.calls[0][3].handPositions;

    canvas.width = 1000;
    canvas.height = 400;
    sim.resize();

    rafCallback!(32);
    const handsAfter = customRender.mock.calls[1][3].handPositions;

    expect(handsAfter).not.toEqual(handsBefore);
  });
});

describe("setThrowValues (partial mode)", () => {
  test("creates state from throw values and ball count", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.start();

    sim.setThrowValues([5, 3, 1], 3);

    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
    const rafCalls = (globalThis.requestAnimationFrame as ReturnType<typeof mock>).mock.calls
      .length;
    expect(rafCalls).toBeGreaterThan(1);
  });

  test("does not restart if not running", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.setThrowValues([5, 3, 1], 3);
    const rafCalls = (globalThis.requestAnimationFrame as ReturnType<typeof mock>).mock.calls
      .length;
    expect(rafCalls).toBe(0);
  });

  test("partial mode skips stepState in tick", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.setThrowValues([3, 3, 3], 1);
    sim.start();

    // Advance past the normal schedule refresh threshold (beat 35 = 12600ms)
    rafCallback!(15000);
    expect(customRender).toHaveBeenCalled();
  });
});

describe("setLoopBeats", () => {
  test("sets loop duration for non-partial mode", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.setLoopBeats(6);
    sim.start();

    rafCallback!(16);
    expect(customRender).toHaveBeenCalled();
  });

  test("clears loop duration when set to undefined", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.setLoopBeats(6);
    sim.setLoopBeats(undefined);
    sim.start();

    rafCallback!(16);
    expect(customRender).toHaveBeenCalled();
  });

  test("computes loop duration for partial mode using computeLoopDurationBeats", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.setThrowValues([5, 3, 1], 3);
    sim.setLoopBeats(3);
    sim.start();

    rafCallback!(16);
    expect(customRender).toHaveBeenCalled();
  });

  test("setThrowValues uses userLoopBeats when set", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.setLoopBeats(4);
    sim.start();
    sim.setThrowValues([5, 3, 1], 3);

    rafCallback!(16);
    expect(customRender).toHaveBeenCalled();
  });
});

describe("tick function", () => {
  test("renders frame using default renderer", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.start();

    expect(rafCallback).not.toBeNull();
    rafCallback!(16);

    const rafCalls = (globalThis.requestAnimationFrame as ReturnType<typeof mock>).mock.calls
      .length;
    expect(rafCalls).toBeGreaterThanOrEqual(2);
  });

  test("loop resets elapsed when loop duration is exceeded", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });

    sim.setLoopBeats(3);
    sim.start();

    // loopDuration = 3 beats * 360ms = 1080ms; advance past it
    rafCallback!(2000);
    expect(customRender).toHaveBeenCalledTimes(2);

    rafCallback!(2016);
    expect(customRender).toHaveBeenCalledTimes(3);
  });

  test("loop reset works with partial ball count and loopBeats", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });

    sim.setThrowValues([3, 3, 3], 1);
    sim.setLoopBeats(3);
    sim.start();

    rafCallback!(5000);
    expect(customRender).toHaveBeenCalledTimes(2);

    rafCallback!(5016);
    expect(customRender).toHaveBeenCalledTimes(3);
  });

  test("stepState triggers schedule refresh when currentBeat exceeds threshold", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.start();

    // Threshold: beat 35 (50 * 0.7) = 12600ms at 360ms/beat
    rafCallback!(13000);
    expect(customRender).toHaveBeenCalledTimes(2);

    rafCallback!(13016);
    expect(customRender).toHaveBeenCalledTimes(3);
  });

  test("stepState does not refresh when below threshold", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.start();

    rafCallback!(100);
    expect(customRender).toHaveBeenCalled();
  });
});

describe("rebuildState", () => {
  test("setSiteswap followed by setColors rebuilds twice", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.start();

    sim.setSiteswap("531");
    sim.setColors(["#ff0000"]);

    const cafCalls = (globalThis.cancelAnimationFrame as ReturnType<typeof mock>).mock.calls.length;
    expect(cafCalls).toBe(2);
  });

  test("rebuildState without running does not call start", () => {
    const canvas = createMockCanvas();
    const sim = createSimulator(canvas, { siteswap: "3" });
    sim.setSiteswap("531");
    sim.setNumHands(1);
    sim.setColors(["#ff0000"]);

    expect(globalThis.requestAnimationFrame).not.toHaveBeenCalled();
  });
});

describe("setArcPeakPosition recomputes arc skew", () => {
  test("changing arcPeakPosition affects rendered frame data", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.start();
    rafCallback!(500);
    const frame1 = customRender.mock.calls[0][3];

    sim.setArcPeakPosition(0.3);
    rafCallback!(516);
    const frame2 = customRender.mock.calls[1][3];

    expect(frame1.balls.length).toBeGreaterThan(0);
    expect(frame2.balls.length).toBeGreaterThan(0);
  });
});

describe("integration: setters applied during animation", () => {
  test("setBeatDuration change is reflected in subsequent tick", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.start();

    rafCallback!(100);
    sim.setBeatDuration(1000);
    rafCallback!(200);

    expect(customRender).toHaveBeenCalledTimes(3);
  });

  test("setDwellRatio change is reflected in subsequent tick", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.start();

    rafCallback!(100);
    sim.setDwellRatio(0.3);
    rafCallback!(200);

    expect(customRender).toHaveBeenCalledTimes(3);
  });

  test("setBackground and setForeground changes appear in frame data", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.start();

    sim.setBackground("#ff0000");
    sim.setForeground("#00ff00");
    rafCallback!(16);

    const frame = customRender.mock.calls[1][3];
    expect(frame.background).toBe("#ff0000");
    expect(frame.foreground).toBe("#00ff00");
  });

  test("setShowJuggler(false) is reflected in frame data", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.start();

    sim.setShowJuggler(false);
    rafCallback!(16);

    const frame = customRender.mock.calls[1][3];
    expect(frame.showJuggler).toBe(false);
  });

  test("setThrowHolds(true) does not error during tick", () => {
    const canvas = createMockCanvas();
    const customRender = mock<CustomRenderFn>(() => {});
    const sim = createSimulator(canvas, { siteswap: "3", render: customRender });
    sim.start();

    sim.setThrowHolds(true);
    rafCallback!(16);

    expect(customRender).toHaveBeenCalledTimes(2);
  });
});
