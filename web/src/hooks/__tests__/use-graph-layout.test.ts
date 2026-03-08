import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const mockPostMessage = mock(() => {});
const mockWorker = new EventTarget() as EventTarget & { postMessage: typeof mockPostMessage };
mockWorker.postMessage = mockPostMessage;

mock.module("@/hooks/graph-layout-worker", () => ({ worker: mockWorker }));

mock.module("@/paraglide/messages.js", () => ({
  m: new Proxy({}, { get: () => () => "stub" }),
}));

function emitWorkerMessage(data: unknown) {
  mockWorker.dispatchEvent(new MessageEvent("message", { data }));
}

function getLastRequestId(): number {
  const lastCall = mockPostMessage.mock.calls.at(-1);
  return (lastCall![0] as { id: number }).id;
}

let testCounter = 100;
function makeTestData() {
  testCounter++;
  return {
    nodes: [7, 14],
    edges: [{ from: 7, to: 14, throw_height: testCounter }],
    ground_state: 7,
    num_nodes: testCounter,
    num_edges: 1,
    max_height: 5,
    num_props: 3,
  };
}

describe("useGraphLayout", () => {
  let unmountHook: (() => void) | undefined;

  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  afterEach(() => {
    unmountHook?.();
    unmountHook = undefined;
  });

  it("returns null layout and null progress when data is undefined", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const { result, unmount } = renderHook(() => useGraphLayout(undefined, false, false));
    unmountHook = unmount;
    expect(result.current.layout).toBeNull();
    expect(result.current.progress).toBeNull();
  });

  it("posts message to worker when data is provided", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const data = makeTestData();
    const { unmount } = renderHook(() => useGraphLayout(data, false, true));
    unmountHook = unmount;
    expect(mockPostMessage).toHaveBeenCalled();
  });

  it("deduplicates identical requests", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const data = makeTestData();

    const { rerender, unmount } = renderHook(({ d }) => useGraphLayout(d, false, false), {
      initialProps: { d: data },
    });
    unmountHook = unmount;

    const callsBefore = mockPostMessage.mock.calls.length;
    rerender({ d: data });

    expect(mockPostMessage.mock.calls.length).toBe(callsBefore);
  });

  it("sends new request when params change", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const data1 = makeTestData();
    const data2 = makeTestData();

    const { rerender, unmount } = renderHook(({ d }) => useGraphLayout(d, false, false), {
      initialProps: { d: data1 },
    });
    unmountHook = unmount;

    const callsBefore = mockPostMessage.mock.calls.length;
    rerender({ d: data2 });

    expect(mockPostMessage.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("returns null layout before worker responds", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const data = makeTestData();
    const { result, unmount } = renderHook(() => useGraphLayout(data, true, false));
    unmountHook = unmount;
    expect(result.current.layout).toBeNull();
  });

  it("returns layout when worker sends result message", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const data = makeTestData();
    const { result, rerender, unmount } = renderHook(({ d }) => useGraphLayout(d, false, false), {
      initialProps: { d: data },
    });
    unmountHook = unmount;

    const id = getLastRequestId();
    const layout = { nodes: [], edges: [], simplified: false };

    emitWorkerMessage({ type: "result", id, layout });
    rerender({ d: data });

    expect(result.current.layout).toEqual(layout);
    expect(result.current.progress).toBeNull();
  });

  it("returns progress after delay threshold", async () => {
    const { useGraphLayout, PHASE_LABELS } = await import("../use-graph-layout");
    const data = makeTestData();
    const { result, rerender, unmount } = renderHook(({ d }) => useGraphLayout(d, false, false), {
      initialProps: { d: data },
    });
    unmountHook = unmount;

    const id = getLastRequestId();
    const originalNow = Date.now;
    Date.now = () => originalNow() + 300;

    try {
      emitWorkerMessage({
        type: "progress",
        id,
        phase: "building-graph",
        phaseIndex: 1,
        totalPhases: 5,
      });
      rerender({ d: data });

      expect(result.current.progress).toEqual({
        phase: "building-graph",
        phaseIndex: 1,
        totalPhases: 5,
      });
      expect(PHASE_LABELS["building-graph"]).toBe("stub");
    } finally {
      Date.now = originalNow;
    }
  });

  it("suppresses progress before delay threshold", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const data = makeTestData();
    const { result, rerender, unmount } = renderHook(({ d }) => useGraphLayout(d, false, false), {
      initialProps: { d: data },
    });
    unmountHook = unmount;

    const id = getLastRequestId();

    emitWorkerMessage({
      type: "progress",
      id,
      phase: "expanding",
      phaseIndex: 0,
      totalPhases: 5,
    });
    rerender({ d: data });

    expect(result.current.progress).toBeNull();
  });

  it("clears progress when result arrives", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const data = makeTestData();
    const { result, rerender, unmount } = renderHook(({ d }) => useGraphLayout(d, false, false), {
      initialProps: { d: data },
    });
    unmountHook = unmount;

    const id = getLastRequestId();
    const originalNow = Date.now;
    Date.now = () => originalNow() + 300;

    try {
      emitWorkerMessage({
        type: "progress",
        id,
        phase: "computing-layout",
        phaseIndex: 2,
        totalPhases: 5,
      });
      rerender({ d: data });
      expect(result.current.progress).not.toBeNull();
    } finally {
      Date.now = originalNow;
    }

    const layout = { nodes: [], edges: [], simplified: false };
    emitWorkerMessage({ type: "result", id, layout });
    rerender({ d: data });

    expect(result.current.layout).toEqual(layout);
    expect(result.current.progress).toBeNull();
  });
});
