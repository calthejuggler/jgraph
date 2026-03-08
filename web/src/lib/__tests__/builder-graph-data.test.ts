import { describe, expect, test } from "bun:test";

import type { BuilderState } from "@/hooks/use-builder-reducer";

import { builderStateToGraphData } from "../builder-graph-data";

describe("builderStateToGraphData", () => {
  test("produces correct nodes and edges from builder steps", () => {
    const state: BuilderState = {
      groundState: 7,
      currentState: 6,
      steps: [
        { state: 7, throwHeight: 3, destination: 6 },
        { state: 6, throwHeight: 2, destination: 5 },
      ],
      visitedStates: new Set([7, 6, 5]),
    };

    const result = builderStateToGraphData(state, 4, 3);

    expect(result.nodes).toEqual([7, 6, 5]);
    expect(result.edges).toEqual([
      { from: 7, to: 6, throw_height: 3 },
      { from: 6, to: 5, throw_height: 2 },
    ]);
    expect(result.ground_state).toBe(7);
    expect(result.num_nodes).toBe(3);
    expect(result.num_edges).toBe(2);
    expect(result.max_height).toBe(4);
    expect(result.num_props).toBe(3);
  });

  test("deduplicates edges with same from/to/throw", () => {
    const state: BuilderState = {
      groundState: 7,
      currentState: 7,
      steps: [
        { state: 7, throwHeight: 3, destination: 6 },
        { state: 6, throwHeight: 2, destination: 7 },
        { state: 7, throwHeight: 3, destination: 6 }, // duplicate
      ],
      visitedStates: new Set([7, 6]),
    };

    const result = builderStateToGraphData(state, 4, 3);

    expect(result.num_edges).toBe(2);
    expect(result.edges).toEqual([
      { from: 7, to: 6, throw_height: 3 },
      { from: 6, to: 7, throw_height: 2 },
    ]);
  });

  test("empty steps produce no edges", () => {
    const state: BuilderState = {
      groundState: 7,
      currentState: 7,
      steps: [],
      visitedStates: new Set([7]),
    };

    const result = builderStateToGraphData(state, 4, 3);

    expect(result.nodes).toEqual([7]);
    expect(result.edges).toEqual([]);
    expect(result.num_nodes).toBe(1);
    expect(result.num_edges).toBe(0);
  });

  test("same from/to but different throw heights are kept as separate edges", () => {
    const state: BuilderState = {
      groundState: 7,
      currentState: 6,
      steps: [
        { state: 7, throwHeight: 3, destination: 6 },
        { state: 7, throwHeight: 1, destination: 6 },
      ],
      visitedStates: new Set([7, 6]),
    };

    const result = builderStateToGraphData(state, 4, 3);

    expect(result.num_edges).toBe(2);
  });
});
