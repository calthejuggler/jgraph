import { describe, expect, it } from "bun:test";

import { builderReducer, createInitialState } from "../use-builder-reducer";

describe("CHOOSE_THROW", () => {
  it("appends step, updates currentState, adds destination to visitedStates", () => {
    const initial = createInitialState(0);
    const next = builderReducer(initial, {
      type: "CHOOSE_THROW",
      throwHeight: 3,
      destination: 7,
    });

    expect(next.currentState).toBe(7);
    expect(next.steps).toHaveLength(1);
    expect(next.steps[0]).toEqual({ state: 0, throwHeight: 3, destination: 7 });
    expect(next.visitedStates.has(0)).toBe(true);
    expect(next.visitedStates.has(7)).toBe(true);
  });
});

describe("UNDO", () => {
  it("is a no-op when steps is empty", () => {
    const initial = createInitialState(0);
    const next = builderReducer(initial, { type: "UNDO" });
    expect(next).toBe(initial);
  });

  it("removes last step, reverts currentState, and rebuilds visitedStates", () => {
    let state = createInitialState(0);
    state = builderReducer(state, {
      type: "CHOOSE_THROW",
      throwHeight: 3,
      destination: 7,
    });
    state = builderReducer(state, {
      type: "CHOOSE_THROW",
      throwHeight: 5,
      destination: 12,
    });
    state = builderReducer(state, { type: "UNDO" });

    expect(state.currentState).toBe(7);
    expect(state.steps).toHaveLength(1);
    expect(state.visitedStates).toEqual(new Set([0, 7]));
  });
});

describe("RESET", () => {
  it("clears all accumulated state with new groundState", () => {
    let state = createInitialState(0);
    state = builderReducer(state, {
      type: "CHOOSE_THROW",
      throwHeight: 3,
      destination: 7,
    });
    state = builderReducer(state, { type: "RESET", groundState: 42 });

    expect(state).toEqual({
      groundState: 42,
      currentState: 42,
      steps: [],
      visitedStates: new Set([42]),
    });
  });
});
