import { describe, expect, test } from "bun:test";

import {
  buildDagreGraph,
  computeGraphLayout,
  expandCompactResponse,
  extractEdges,
  extractNodes,
  runDagreLayout,
  SIMPLIFIED_THRESHOLD,
} from "../graph-layout";
import type { GraphApiResponse } from "../graph-types";

const sampleData: GraphApiResponse = {
  nodes: [7, 6, 5],
  edges: [
    { from: 7, to: 6, throw_height: 3 },
    { from: 6, to: 5, throw_height: 2 },
  ],
  ground_state: 7,
  num_nodes: 3,
  num_edges: 2,
  max_height: 3,
  num_props: 3,
};

describe("expandCompactResponse", () => {
  test("converts numeric nodes to binary labels", () => {
    const result = expandCompactResponse(sampleData, false, false);

    // 7=111, 6=110, 5=101 with maxHeight=3
    expect(result.nodes).toEqual(["111", "110", "101"]);
    expect(result.ground_state).toBe("111");
  });

  test("reversed binary labels are flipped", () => {
    const result = expandCompactResponse(sampleData, true, false);

    // 7=111 reversed = "111", 6=110 reversed = "011", 5=101 reversed = "101"
    expect(result.nodes).toEqual(["111", "011", "101"]);
  });

  test("abbreviated mode uses gap-based labels", () => {
    const result = expandCompactResponse(sampleData, false, true);

    // 7=0b111 maxHeight=3: all bits set → "000"
    // 6=0b110 maxHeight=3: bits at pos 2,1 → gaps 0,0 → "00"
    // 5=0b101 maxHeight=3: bits at pos 2,0 → gaps 0,1 → "01"
    expect(result.nodes).toEqual(["000", "00", "01"]);
  });

  test("edge labels are expanded alongside nodes", () => {
    const result = expandCompactResponse(sampleData, false, false);

    expect(result.edges[0]).toEqual({ from: "111", to: "110", throw_height: 3 });
    expect(result.edges[1]).toEqual({ from: "110", to: "101", throw_height: 2 });
  });

  test("preserves metadata fields", () => {
    const result = expandCompactResponse(sampleData, false, false);

    expect(result.num_nodes).toBe(3);
    expect(result.num_edges).toBe(2);
    expect(result.max_height).toBe(3);
    expect(result.num_props).toBe(3);
  });
});

describe("extractEdges", () => {
  test("non-simplified edges include siteswap labels", () => {
    const expanded = expandCompactResponse(sampleData, false, false);
    const edges = extractEdges(expanded, false);

    expect(edges[0].type).toBe("graphEdge");
    expect(edges[0].label).toBe("3");
    expect(edges[0].source).toBe("111");
    expect(edges[0].target).toBe("110");
  });

  test("simplified edges omit labels", () => {
    const expanded = expandCompactResponse(sampleData, false, false);
    const edges = extractEdges(expanded, true);

    expect(edges[0].type).toBe("simplifiedEdge");
    expect(edges[0].label).toBeUndefined();
  });

  test("edge IDs encode from/to/throw_height", () => {
    const expanded = expandCompactResponse(sampleData, false, false);
    const edges = extractEdges(expanded, false);

    expect(edges[0].id).toBe("e-111-110-3");
    expect(edges[1].id).toBe("e-110-101-2");
  });

  test("throw heights >= 10 use siteswap letter notation in labels", () => {
    const data: GraphApiResponse = {
      nodes: [7, 6],
      edges: [{ from: 7, to: 6, throw_height: 12 }],
      ground_state: 7,
      num_nodes: 2,
      num_edges: 1,
      max_height: 3,
      num_props: 3,
    };
    const expanded = expandCompactResponse(data, false, false);
    const edges = extractEdges(expanded, false);

    expect(edges[0].label).toBe("c"); // 12 in siteswap notation
  });
});

describe("buildDagreGraph", () => {
  test("creates a graph with all nodes from expanded response", () => {
    const expanded = expandCompactResponse(sampleData, false, false);
    const g = buildDagreGraph(expanded);

    expect(g.nodes()).toEqual(expect.arrayContaining(["111", "110", "101"]));
    expect(g.nodes()).toHaveLength(3);
  });

  test("creates a graph with all edges from expanded response", () => {
    const expanded = expandCompactResponse(sampleData, false, false);
    const g = buildDagreGraph(expanded);

    expect(g.edgeCount()).toBe(2);
    expect(g.hasEdge("111", "110")).toBe(true);
    expect(g.hasEdge("110", "101")).toBe(true);
  });

  test("sets rankdir to TB", () => {
    const expanded = expandCompactResponse(sampleData, false, false);
    const g = buildDagreGraph(expanded);

    expect(g.graph().rankdir).toBe("TB");
  });

  test("nodes have width and height metadata", () => {
    const expanded = expandCompactResponse(sampleData, false, false);
    const g = buildDagreGraph(expanded);

    const nodeData = g.node("111");
    expect(nodeData.width).toBe(120);
    expect(nodeData.height).toBe(40);
  });
});

describe("runDagreLayout", () => {
  test("assigns x and y coordinates to nodes", () => {
    const expanded = expandCompactResponse(sampleData, false, false);
    const g = buildDagreGraph(expanded);

    const nodeBefore = g.node("111");
    expect(nodeBefore.x).toBeUndefined();
    expect(nodeBefore.y).toBeUndefined();

    runDagreLayout(g);

    const nodeAfter = g.node("111");
    expect(nodeAfter.x).toBeNumber();
    expect(nodeAfter.y).toBeNumber();
  });
});

describe("extractNodes", () => {
  test("returns positioned nodes with correct structure", () => {
    const expanded = expandCompactResponse(sampleData, false, false);
    const g = buildDagreGraph(expanded);
    runDagreLayout(g);

    const nodes = extractNodes(g, expanded, "111");

    expect(nodes).toHaveLength(3);
    for (const node of nodes) {
      expect(node.type).toBe("graphNode");
      expect(node.position.x).toBeNumber();
      expect(node.position.y).toBeNumber();
    }
  });

  test("marks the base node with isBase=true", () => {
    const expanded = expandCompactResponse(sampleData, false, false);
    const g = buildDagreGraph(expanded);
    runDagreLayout(g);

    const nodes = extractNodes(g, expanded, "111");
    const baseNode = nodes.find((n) => n.id === "111");
    const otherNode = nodes.find((n) => n.id === "110");

    expect(baseNode?.data.isBase).toBe(true);
    expect(otherNode?.data.isBase).toBe(false);
  });

  test("positions are offset by half node dimensions", () => {
    const expanded = expandCompactResponse(sampleData, false, false);
    const g = buildDagreGraph(expanded);
    runDagreLayout(g);

    const nodes = extractNodes(g, expanded, "111");
    const node = nodes[0];
    const dagrePos = g.node(node.id);

    // position should be dagre center minus half width/height
    expect(node.position.x).toBe(dagrePos.x - 60);
    expect(node.position.y).toBe(dagrePos.y - 20);
  });

  test("node data includes the label", () => {
    const expanded = expandCompactResponse(sampleData, false, false);
    const g = buildDagreGraph(expanded);
    runDagreLayout(g);

    const nodes = extractNodes(g, expanded, "111");

    for (const node of nodes) {
      expect(node.data.label).toBe(node.id);
    }
  });
});

describe("computeGraphLayout", () => {
  test("returns nodes, edges, and simplified flag for small graphs", () => {
    const result = computeGraphLayout(sampleData, false, false);

    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);
    expect(result.simplified).toBe(false);
  });

  test("marks graph as simplified when num_nodes exceeds threshold", () => {
    const largeData: GraphApiResponse = {
      ...sampleData,
      num_nodes: SIMPLIFIED_THRESHOLD + 1,
    };
    const result = computeGraphLayout(largeData, false, false);

    expect(result.simplified).toBe(true);
    expect(result.edges[0].type).toBe("simplifiedEdge");
    expect(result.edges[0].label).toBeUndefined();
  });

  test("non-simplified graph edges have siteswap labels", () => {
    const result = computeGraphLayout(sampleData, false, false);

    expect(result.edges[0].type).toBe("graphEdge");
    expect(result.edges[0].label).toBe("3");
  });

  test("ground state is used as the base node", () => {
    const result = computeGraphLayout(sampleData, false, false);
    const baseNode = result.nodes.find((n) => n.id === "111");

    expect(baseNode?.data.isBase).toBe(true);
  });

  test("passes abbreviated flag through to label generation", () => {
    const result = computeGraphLayout(sampleData, false, true);

    // 7=0b111 with maxHeight=3 abbreviated → "000"
    expect(result.nodes[0].data.label).toBe("000");
  });

  test("passes reversed flag through to label generation", () => {
    const result = computeGraphLayout(sampleData, true, false);

    // 6=110 reversed = "011"
    const node011 = result.nodes.find((n) => n.id === "011");
    expect(node011).toBeDefined();
  });
});
