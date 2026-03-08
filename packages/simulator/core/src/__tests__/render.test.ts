import { describe, expect, test } from "bun:test";

import type { FrameData } from "../render.js";
import { clearCanvas, drawBall, drawHand, drawJuggler, renderFrame } from "../render.js";

const createMockCtx = () => {
  const calls: { method: string; args: unknown[] }[] = [];

  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      if (prop === "__calls") return calls;
      if (
        prop === "fillStyle" ||
        prop === "strokeStyle" ||
        prop === "lineWidth" ||
        prop === "lineCap" ||
        prop === "lineJoin"
      ) {
        return undefined;
      }
      return (...args: unknown[]) => {
        calls.push({ method: prop, args });
      };
    },
    set(_target, prop: string, value: unknown) {
      calls.push({ method: `set:${prop}`, args: [value] });
      return true;
    },
  };

  return new Proxy({}, handler) as unknown as CanvasRenderingContext2D & {
    __calls: typeof calls;
  };
};

const findCalls = (ctx: ReturnType<typeof createMockCtx>, method: string) =>
  ctx.__calls.filter((c) => c.method === method);

describe("clearCanvas", () => {
  test("transparent calls clearRect, not fillRect", () => {
    const ctx = createMockCtx();
    clearCanvas(ctx, 400, 600, "transparent");
    expect(findCalls(ctx, "clearRect")).toHaveLength(1);
    expect(findCalls(ctx, "fillRect")).toHaveLength(0);
  });

  test("non-transparent calls fillRect with correct color", () => {
    const ctx = createMockCtx();
    clearCanvas(ctx, 400, 600, "#111111");
    expect(findCalls(ctx, "fillRect")).toHaveLength(1);
    expect(findCalls(ctx, "fillRect")[0].args).toEqual([0, 0, 400, 600]);
    const fillStyleSets = ctx.__calls.filter(
      (c) => c.method === "set:fillStyle" && c.args[0] === "#111111",
    );
    expect(fillStyleSets.length).toBeGreaterThan(0);
  });
});

describe("renderFrame", () => {
  const baseFrame: FrameData = {
    background: "#000",
    foreground: "white",
    showJuggler: false,
    handPositions: [
      { x: 250, y: 500 },
      { x: 150, y: 500 },
    ],
    balls: [{ position: { x: 200, y: 300 }, color: "red" }],
  };

  test("calls clearCanvas (fillRect or clearRect)", () => {
    const ctx = createMockCtx();
    renderFrame(ctx, 400, 600, baseFrame);
    const clears = [...findCalls(ctx, "fillRect"), ...findCalls(ctx, "clearRect")];
    expect(clears.length).toBeGreaterThan(0);
  });

  test("draws hands for each hand position", () => {
    const ctx = createMockCtx();
    renderFrame(ctx, 400, 600, baseFrame);
    const arcCalls = findCalls(ctx, "arc");
    // 2 hands + 1 ball = 3 arcs minimum
    expect(arcCalls.length).toBeGreaterThanOrEqual(3);
  });

  test("draws juggler when showJuggler is true", () => {
    const ctx = createMockCtx();
    const frame: FrameData = { ...baseFrame, showJuggler: true };
    renderFrame(ctx, 400, 600, frame);
    const arcCalls = findCalls(ctx, "arc");
    // 1 head + 2 hands + 1 ball
    expect(arcCalls.length).toBeGreaterThanOrEqual(4);
  });

  test("draws each ball", () => {
    const ctx = createMockCtx();
    const frame: FrameData = {
      ...baseFrame,
      balls: [
        { position: { x: 200, y: 300 }, color: "red" },
        { position: { x: 100, y: 200 }, color: "blue" },
      ],
    };
    renderFrame(ctx, 400, 600, frame);
    const fillCalls = findCalls(ctx, "fill");
    expect(fillCalls).toHaveLength(2);
  });
});

describe("drawBall", () => {
  test("calls arc with correct radius scaling", () => {
    const ctx = createMockCtx();
    drawBall(ctx, 400, { x: 200, y: 300 }, "red");
    const arcCalls = findCalls(ctx, "arc");
    expect(arcCalls).toHaveLength(1);
    // radius = 400 * 0.032 = 12.8
    expect(arcCalls[0].args[2]).toBeCloseTo(12.8);
    expect(arcCalls[0].args[0]).toBe(200);
    expect(arcCalls[0].args[1]).toBe(300);
  });
});

describe("drawHand", () => {
  test("calls arc with semi-circle (0 to Math.PI)", () => {
    const ctx = createMockCtx();
    drawHand(ctx, 400, { x: 200, y: 500 });
    const arcCalls = findCalls(ctx, "arc");
    expect(arcCalls).toHaveLength(1);
    expect(arcCalls[0].args[3]).toBe(0); // startAngle
    expect(arcCalls[0].args[4]).toBeCloseTo(Math.PI); // endAngle
  });
});

describe("drawJuggler", () => {
  test("draws head arc, spine, shoulder line, and arm segments", () => {
    const ctx = createMockCtx();
    const hands = [
      { x: 250, y: 500 },
      { x: 150, y: 500 },
    ];
    drawJuggler(ctx, 400, 600, hands);

    const arcCalls = findCalls(ctx, "arc");
    expect(arcCalls.length).toBeGreaterThanOrEqual(1);

    // head + spine + shoulders + 2 arms
    const strokeCalls = findCalls(ctx, "stroke");
    expect(strokeCalls.length).toBeGreaterThanOrEqual(4);

    const beginPathCalls = findCalls(ctx, "beginPath");
    expect(beginPathCalls.length).toBeGreaterThanOrEqual(4);
  });
});
