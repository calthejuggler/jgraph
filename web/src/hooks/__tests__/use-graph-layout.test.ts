import { renderHook } from "@testing-library/react";
import { describe, expect, it, mock } from "bun:test";

const mockPostMessage = mock(() => {});

mock.module("@/workers/graph-layout.worker?worker", () => ({
  default: class {
    postMessage = mockPostMessage;
    addEventListener() {}
  },
}));

mock.module("@/paraglide/messages.js", () => ({
  m: new Proxy({}, { get: () => () => "stub" }),
}));

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
  it("returns null layout and null progress when data is undefined", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const { result } = renderHook(() => useGraphLayout(undefined, false, false));
    expect(result.current.layout).toBeNull();
    expect(result.current.progress).toBeNull();
  });

  it("posts message to worker when data is provided", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const data = makeTestData();
    const callsBefore = mockPostMessage.mock.calls.length;

    renderHook(() => useGraphLayout(data, false, true));

    expect(mockPostMessage.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("deduplicates identical requests", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const data = makeTestData();

    const { rerender } = renderHook(({ d }) => useGraphLayout(d, false, false), {
      initialProps: { d: data },
    });

    const callsBefore = mockPostMessage.mock.calls.length;
    rerender({ d: data });

    expect(mockPostMessage.mock.calls.length).toBe(callsBefore);
  });

  it("sends new request when params change", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const data1 = makeTestData();
    const data2 = makeTestData();

    const { rerender } = renderHook(({ d }) => useGraphLayout(d, false, false), {
      initialProps: { d: data1 },
    });

    const callsBefore = mockPostMessage.mock.calls.length;
    rerender({ d: data2 });

    expect(mockPostMessage.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("returns null layout before worker responds", async () => {
    const { useGraphLayout } = await import("../use-graph-layout");
    const data = makeTestData();
    const { result } = renderHook(() => useGraphLayout(data, true, false));

    expect(result.current.layout).toBeNull();
  });
});
