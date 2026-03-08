import { render } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "bun:test";

import { Ball } from "../ball.js";
import { Canvas } from "../canvas.js";
import { Hand, Hands } from "../hands.js";
import { Juggler } from "../juggler.js";
import { Root } from "../root.js";
import { getActiveMock, resetActiveMock, setupSimulatorMock } from "./helpers.js";

setupSimulatorMock();

beforeEach(resetActiveMock);

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
