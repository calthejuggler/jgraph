import { describe, expect, test } from "bun:test";

import { expandCompactResponse, extractEdges } from "../graph-layout";
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
