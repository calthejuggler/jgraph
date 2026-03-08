import { clearCanvas, drawBall, drawHand, drawJuggler } from "@juggling-tools/simulator";
import type { FrameData } from "@juggling-tools/simulator";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { Ball } from "../ball.js";
import { Canvas } from "../canvas.js";
import { Hand, Hands } from "../hands.js";
import { Juggler } from "../juggler.js";
import { Root } from "../root.js";
import { getActiveMock, resetActiveMock, setupSimulatorMock } from "./helpers.js";

setupSimulatorMock();

const mockClearCanvas = clearCanvas as ReturnType<typeof mock>;
const mockDrawBall = drawBall as ReturnType<typeof mock>;
const mockDrawHand = drawHand as ReturnType<typeof mock>;
const mockDrawJuggler = drawJuggler as ReturnType<typeof mock>;

const mockCtx = {} as CanvasRenderingContext2D;

const baseFrame: FrameData = {
  background: "#111",
  foreground: "#fff",
  showJuggler: true,
  handPositions: [
    { x: 100, y: 400 },
    { x: 300, y: 400 },
  ],
  balls: [{ position: { x: 200, y: 200 }, color: "red" }],
};

function getCapturedRender() {
  const sim = getActiveMock()!;
  const calls = sim.setRender.mock.calls;
  return calls[calls.length - 1][0] as (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    frame: FrameData,
  ) => void;
}

beforeEach(() => {
  resetActiveMock();
  mockClearCanvas.mockClear();
  mockDrawBall.mockClear();
  mockDrawHand.mockClear();
  mockDrawJuggler.mockClear();
});

describe("Canvas", () => {
  test("renders a canvas element", () => {
    const { container } = render(
      <Root siteswap="3">
        <Canvas />
      </Root>,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });

  test("forwards HTML attributes to the canvas element", () => {
    const { container } = render(
      <Root siteswap="3">
        <Canvas className="my-class" width={400} height={300} />
      </Root>,
    );
    const canvas = container.querySelector("canvas")!;
    expect(canvas.getAttribute("class")).toBe("my-class");
    expect(canvas.getAttribute("width")).toBe("400");
    expect(canvas.getAttribute("height")).toBe("300");
  });

  test("registers canvas with the simulator context", () => {
    render(
      <Root siteswap="3">
        <Canvas />
      </Root>,
    );
    expect(getActiveMock()).not.toBeNull();
  });

  test("sets custom render function when visual children are present", () => {
    render(
      <Root siteswap="3">
        <Canvas>
          <Juggler />
        </Canvas>
      </Root>,
    );
    const sim = getActiveMock()!;
    expect(sim.setRender).toHaveBeenCalled();
    const calls = sim.setRender.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(typeof lastCall[0]).toBe("function");
  });

  test("uses default renderer when no visual children are present", () => {
    render(
      <Root siteswap="3">
        <Canvas />
      </Root>,
    );
    const sim = getActiveMock()!;
    expect(sim.setRender).toHaveBeenCalled();
    const calls = sim.setRender.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toBeUndefined();
  });

  test("sets hand count from Hands component", () => {
    render(
      <Root siteswap="3">
        <Canvas>
          <Hands count={4} />
        </Canvas>
      </Root>,
    );
    const sim = getActiveMock()!;
    expect(sim.setNumHands).toHaveBeenCalledWith(4);
  });

  test("sets ball colors from Ball components", () => {
    render(
      <Root siteswap="531">
        <Canvas>
          <Ball color="red" />
          <Ball color="green" />
          <Ball color="blue" />
        </Canvas>
      </Root>,
    );
    const sim = getActiveMock()!;
    expect(sim.setColors).toHaveBeenCalledWith(["red", "green", "blue"]);
  });

  test("handles mixed visual children", () => {
    render(
      <Root siteswap="531">
        <Canvas>
          <Juggler />
          <Hands count={2}>
            <Hand />
          </Hands>
          <Ball color="red" />
        </Canvas>
      </Root>,
    );
    const sim = getActiveMock()!;
    expect(sim.setRender).toHaveBeenCalled();
    expect(sim.setNumHands).toHaveBeenCalledWith(2);
    expect(sim.setColors).toHaveBeenCalledWith(["red"]);
  });
});

describe("renderWithConfig", () => {
  test("calls clearCanvas and drawJuggler with default renderer", () => {
    render(
      <Root siteswap="3">
        <Canvas>
          <Juggler />
        </Canvas>
      </Root>,
    );
    const customRender = getCapturedRender();
    customRender(mockCtx, 400, 600, baseFrame);

    expect(mockClearCanvas).toHaveBeenCalledWith(mockCtx, 400, 600, "#111");
    expect(mockDrawJuggler).toHaveBeenCalledWith(
      mockCtx,
      400,
      600,
      baseFrame.handPositions,
      "#fff",
    );
  });

  test("calls custom juggler render function instead of drawJuggler", () => {
    const customJugglerRender = mock(() => {});
    render(
      <Root siteswap="3">
        <Canvas>
          <Juggler>{customJugglerRender}</Juggler>
        </Canvas>
      </Root>,
    );
    const customRender = getCapturedRender();
    customRender(mockCtx, 400, 600, baseFrame);

    expect(mockDrawJuggler).not.toHaveBeenCalled();
    expect(customJugglerRender).toHaveBeenCalledWith({
      ctx: mockCtx,
      width: 400,
      height: 600,
      handPositions: baseFrame.handPositions,
    });
  });

  test("calls drawHand for each hand with default renderer", () => {
    render(
      <Root siteswap="3">
        <Canvas>
          <Hands count={2}>
            <Hand />
          </Hands>
        </Canvas>
      </Root>,
    );
    const customRender = getCapturedRender();
    customRender(mockCtx, 400, 600, baseFrame);

    expect(mockDrawHand).toHaveBeenCalledTimes(2);
    expect(mockDrawHand).toHaveBeenCalledWith(mockCtx, 400, { x: 100, y: 400 }, "#fff");
    expect(mockDrawHand).toHaveBeenCalledWith(mockCtx, 400, { x: 300, y: 400 }, "#fff");
  });

  test("calls custom hand render function instead of drawHand", () => {
    const customHandRender = mock(() => {});
    render(
      <Root siteswap="3">
        <Canvas>
          <Hands count={2}>
            <Hand>{customHandRender}</Hand>
          </Hands>
        </Canvas>
      </Root>,
    );
    const customRender = getCapturedRender();
    customRender(mockCtx, 400, 600, baseFrame);

    expect(mockDrawHand).not.toHaveBeenCalled();
    expect(customHandRender).toHaveBeenCalledTimes(2);
    expect(customHandRender).toHaveBeenCalledWith({
      ctx: mockCtx,
      position: { x: 100, y: 400 },
      canvasWidth: 400,
    });
  });

  test("calls drawHand when Hands has no Hand children", () => {
    render(
      <Root siteswap="3">
        <Canvas>
          <Hands count={2} />
        </Canvas>
      </Root>,
    );
    const customRender = getCapturedRender();
    customRender(mockCtx, 400, 600, baseFrame);

    expect(mockDrawHand).toHaveBeenCalledTimes(2);
  });

  test("calls drawBall for each ball with default renderer", () => {
    render(
      <Root siteswap="3">
        <Canvas>
          <Ball color="red" />
        </Canvas>
      </Root>,
    );
    const customRender = getCapturedRender();
    customRender(mockCtx, 400, 600, baseFrame);

    expect(mockDrawBall).toHaveBeenCalledWith(mockCtx, 400, { x: 200, y: 200 }, "red");
  });

  test("calls custom ball render function instead of drawBall", () => {
    const customBallRender = mock(() => {});
    render(
      <Root siteswap="3">
        <Canvas>
          <Ball color="red">{customBallRender}</Ball>
        </Canvas>
      </Root>,
    );
    const customRender = getCapturedRender();
    customRender(mockCtx, 400, 600, baseFrame);

    expect(mockDrawBall).not.toHaveBeenCalled();
    expect(customBallRender).toHaveBeenCalledWith({
      ctx: mockCtx,
      position: { x: 200, y: 200 },
      color: "red",
      canvasWidth: 400,
    });
  });

  test("cycles ball configs when more balls than Ball components", () => {
    const frame: FrameData = {
      ...baseFrame,
      balls: [
        { position: { x: 100, y: 100 }, color: "red" },
        { position: { x: 200, y: 200 }, color: "green" },
        { position: { x: 300, y: 300 }, color: "blue" },
      ],
    };
    render(
      <Root siteswap="531">
        <Canvas>
          <Ball color="red" />
          <Ball color="blue" />
        </Canvas>
      </Root>,
    );
    const customRender = getCapturedRender();
    customRender(mockCtx, 400, 600, frame);

    expect(mockDrawBall).toHaveBeenCalledTimes(3);
    // Ball 0 -> config 0 (red), Ball 1 -> config 1 (blue), Ball 2 -> config 0 (red) via cycling
    expect(mockDrawBall).toHaveBeenCalledWith(mockCtx, 400, { x: 100, y: 100 }, "red");
    expect(mockDrawBall).toHaveBeenCalledWith(mockCtx, 400, { x: 200, y: 200 }, "blue");
    expect(mockDrawBall).toHaveBeenCalledWith(mockCtx, 400, { x: 300, y: 300 }, "red");
  });

  test("cycles hand renderers when more hands than Hand components", () => {
    const customHandRender = mock(() => {});
    const frame: FrameData = {
      ...baseFrame,
      handPositions: [
        { x: 100, y: 400 },
        { x: 200, y: 400 },
        { x: 300, y: 400 },
      ],
    };
    render(
      <Root siteswap="3">
        <Canvas>
          <Hands count={3}>
            <Hand>{customHandRender}</Hand>
          </Hands>
        </Canvas>
      </Root>,
    );
    const customRender = getCapturedRender();
    customRender(mockCtx, 400, 600, frame);

    // All 3 hands should use the single Hand renderer (cycling)
    expect(customHandRender).toHaveBeenCalledTimes(3);
  });
});

describe("ResizeObserver", () => {
  let resizeCallback: ResizeObserverCallback | null;
  let mockObserve: ReturnType<typeof mock>;
  let mockDisconnect: ReturnType<typeof mock>;
  const OriginalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    resizeCallback = null;
    mockObserve = mock(() => {});
    mockDisconnect = mock(() => {});
    globalThis.ResizeObserver = class {
      constructor(cb: ResizeObserverCallback) {
        resizeCallback = cb;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = mock(() => {});
    } as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = OriginalResizeObserver;
  });

  test("observes parent element and resizes canvas when no explicit dimensions", () => {
    const { container } = render(
      <Root siteswap="3">
        <Canvas />
      </Root>,
    );

    expect(mockObserve).toHaveBeenCalled();

    const canvas = container.querySelector("canvas")!;
    resizeCallback!(
      [{ contentRect: { width: 800, height: 600 } } as ResizeObserverEntry],
      {} as ResizeObserver,
    );

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);

    const sim = getActiveMock()!;
    expect(sim.resize).toHaveBeenCalled();
  });

  test("does not observe when explicit width and height are provided", () => {
    render(
      <Root siteswap="3">
        <Canvas width={400} height={300} />
      </Root>,
    );

    expect(mockObserve).not.toHaveBeenCalled();
  });

  test("handles empty ResizeObserver entries", () => {
    render(
      <Root siteswap="3">
        <Canvas />
      </Root>,
    );

    const sim = getActiveMock()!;
    sim.resize.mockClear();

    resizeCallback!([], {} as ResizeObserver);
    expect(sim.resize).not.toHaveBeenCalled();
  });
});
