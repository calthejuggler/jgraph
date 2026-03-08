import { describe, expect, it, mock } from "bun:test";

import type { WorkerMessage } from "../graph-layout.worker";

mock.module("@/lib/graph-layout", () => ({
  expandCompactResponse: () => ({
    nodes: [{ id: 1, label: "111" }],
    edges: [{ from: 1, to: 2, throw_height: 3, label: "3" }],
    ground_state: 7,
    num_nodes: 2,
    num_edges: 1,
    max_height: 5,
    num_props: 3,
  }),
  buildDagreGraph: () => ({}),
  runDagreLayout: () => {},
  extractNodes: () => [{ id: 1, x: 0, y: 0, label: "111", isGround: true }],
  extractEdges: () => [{ from: 1, to: 2, label: "3" }],
  SIMPLIFIED_THRESHOLD: 200,
}));

const posted: WorkerMessage[] = [];
Object.defineProperty(self, "postMessage", {
  value: (msg: WorkerMessage) => posted.push(msg),
  writable: true,
});

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    data: {
      nodes: [7, 14],
      edges: [{ from: 7, to: 14, throw_height: 3 }],
      ground_state: 7,
      num_nodes: 2,
      num_edges: 1,
      max_height: 5,
      num_props: 3,
    },
    reversed: false,
    abbreviated: true,
    ...overrides,
  };
}

async function sendMessage(data: ReturnType<typeof makeRequest>) {
  (self.onmessage as (...args: unknown[]) => void).call(
    null,
    new MessageEvent("message", { data }),
  );
  await new Promise<void>((r) => setTimeout(r, 50));
}

describe("graph-layout worker", () => {
  it("sends 5 progress messages followed by a result", async () => {
    await import("../graph-layout.worker");
    posted.length = 0;

    await sendMessage(makeRequest());

    const progressMessages = posted.filter((m) => m.type === "progress");
    const resultMessages = posted.filter((m) => m.type === "result");

    expect(progressMessages).toHaveLength(5);
    expect(resultMessages).toHaveLength(1);
  });

  it("result contains nodes, edges, and simplified flag", async () => {
    posted.length = 0;
    await sendMessage(makeRequest());

    const result = posted.find((m) => m.type === "result");
    expect(result).toBeDefined();
    if (result?.type === "result") {
      expect(result.layout.nodes).toBeArray();
      expect(result.layout.edges).toBeArray();
      expect(typeof result.layout.simplified).toBe("boolean");
    }
  });

  it("sets simplified=false when num_nodes <= 200", async () => {
    posted.length = 0;
    await sendMessage(makeRequest({ data: { ...makeRequest().data, num_nodes: 100 } }));

    const result = posted.find((m) => m.type === "result");
    if (result?.type === "result") {
      expect(result.layout.simplified).toBe(false);
    }
  });

  it("sets simplified=true when num_nodes > 200", async () => {
    posted.length = 0;
    await sendMessage(makeRequest({ data: { ...makeRequest().data, num_nodes: 201 } }));

    const result = posted.find((m) => m.type === "result");
    if (result?.type === "result") {
      expect(result.layout.simplified).toBe(true);
    }
  });

  it("echoes the request id in all messages", async () => {
    posted.length = 0;
    await sendMessage(makeRequest({ id: 42 }));

    for (const msg of posted) {
      expect(msg.id).toBe(42);
    }
  });
});
