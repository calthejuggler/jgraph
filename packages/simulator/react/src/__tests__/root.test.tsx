import type { ReactNode } from "react";
import { createRef } from "react";

import { act, render, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { Canvas } from "../canvas.js";
import type { SimulatorHandle } from "../root.js";
import { Root } from "../root.js";
import { useSimulator } from "../use-simulator.js";
import { getActiveMock, resetActiveMock, setFactoryError, setupSimulatorMock } from "./helpers.js";

setupSimulatorMock();

beforeEach(resetActiveMock);

describe("Root", () => {
  test("renders children", () => {
    const { getByText } = render(
      <Root siteswap="3">
        <span>child content</span>
      </Root>,
    );
    expect(getByText("child content")).not.toBeNull();
  });

  test("creates simulator when canvas is registered", () => {
    render(
      <Root siteswap="531">
        <Canvas />
      </Root>,
    );
    expect(getActiveMock()).not.toBeNull();
  });

  test("auto-starts simulator by default", () => {
    render(
      <Root siteswap="3">
        <Canvas />
      </Root>,
    );
    const sim = getActiveMock();
    expect(sim).not.toBeNull();
    expect(sim!.start).toHaveBeenCalledTimes(1);
  });

  test("does not auto-start when autoStart is false", () => {
    render(
      <Root siteswap="3" autoStart={false}>
        <Canvas />
      </Root>,
    );
    const sim = getActiveMock();
    expect(sim).not.toBeNull();
    expect(sim!.start).not.toHaveBeenCalled();
  });

  test("stops simulator on unmount", () => {
    const { unmount } = render(
      <Root siteswap="3">
        <Canvas />
      </Root>,
    );
    const sim = getActiveMock();
    unmount();
    expect(sim!.stop).toHaveBeenCalled();
  });

  test("provides siteswap via context", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Root siteswap="531">{children}</Root>
    );
    const { result } = renderHook(() => useSimulator(), { wrapper });
    expect(result.current.siteswap).toBe("531");
  });

  test("provides isRunning state as a boolean", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <Root siteswap="3">{children}</Root>;
    const { result } = renderHook(() => useSimulator(), { wrapper });
    expect(typeof result.current.isRunning).toBe("boolean");
  });
});

describe("Root imperative handle", () => {
  test("exposes start, stop, and setSiteswap via ref", () => {
    const ref = createRef<SimulatorHandle>();
    render(
      <Root ref={ref} siteswap="3">
        <Canvas />
      </Root>,
    );
    expect(ref.current).not.toBeNull();
    expect(typeof ref.current!.start).toBe("function");
    expect(typeof ref.current!.stop).toBe("function");
    expect(typeof ref.current!.setSiteswap).toBe("function");
  });

  test("start via ref calls simulator.start", () => {
    const ref = createRef<SimulatorHandle>();
    render(
      <Root ref={ref} siteswap="3" autoStart={false}>
        <Canvas />
      </Root>,
    );
    const sim = getActiveMock()!;
    act(() => ref.current!.start());
    expect(sim.start).toHaveBeenCalled();
  });

  test("stop via ref calls simulator.stop", () => {
    const ref = createRef<SimulatorHandle>();
    render(
      <Root ref={ref} siteswap="3">
        <Canvas />
      </Root>,
    );
    const sim = getActiveMock()!;
    act(() => ref.current!.stop());
    expect(sim.stop).toHaveBeenCalled();
  });
});

describe.each([
  { prop: "beatDuration", initial: 300, updated: 500, setter: "setBeatDuration" },
  { prop: "dwellRatio", initial: 0.5, updated: 0.7, setter: "setDwellRatio" },
  { prop: "arcPeakPosition", initial: 0.5, updated: 0.8, setter: "setArcPeakPosition" },
  { prop: "background", initial: "#000", updated: "#fff", setter: "setBackground" },
  { prop: "foreground", initial: "#000", updated: "#fff", setter: "setForeground" },
  { prop: "throwHolds", initial: false, updated: true, setter: "setThrowHolds" },
] as const)("Root prop update: $prop", ({ prop, initial, updated, setter }) => {
  test(`calls ${setter} when ${prop} changes`, () => {
    const { rerender } = render(
      <Root siteswap="3" {...{ [prop]: initial }}>
        <Canvas />
      </Root>,
    );
    const sim = getActiveMock()!;
    rerender(
      <Root siteswap="3" {...{ [prop]: updated }}>
        <Canvas />
      </Root>,
    );
    expect(sim[setter]).toHaveBeenCalledWith(updated);
  });
});

describe("Root error handling", () => {
  test("calls onError when createSimulator throws", () => {
    const onError = mock(() => {});
    setFactoryError("bad siteswap");

    render(
      <Root siteswap="invalid" onError={onError}>
        <Canvas />
      </Root>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((onError.mock.calls[0][0] as Error).message).toBe("bad siteswap");
  });

  test("exposes error via useSimulator when createSimulator throws", () => {
    setFactoryError("parse error");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Root siteswap="bad">
        <Canvas />
        {children}
      </Root>
    );
    const { result } = renderHook(() => useSimulator(), { wrapper });
    expect(result.current.error).not.toBeNull();
    expect(result.current.error!.message).toBe("parse error");
  });
});

describe("Root throwValues mode", () => {
  test("uses partial mode with throwValues and ballCount", () => {
    render(
      <Root throwValues={[5, 3, 1]} ballCount={3}>
        <Canvas />
      </Root>,
    );
    const sim = getActiveMock()!;
    expect(sim.setThrowValues).toHaveBeenCalledWith([5, 3, 1], 3);
  });

  test("sets loopBeats on the simulator", () => {
    render(
      <Root throwValues={[5, 3, 1]} ballCount={3} loopBeats={6}>
        <Canvas />
      </Root>,
    );
    const sim = getActiveMock()!;
    expect(sim.setLoopBeats).toHaveBeenCalledWith(6);
  });
});
