import { useReducer } from "react";

export interface BuilderStep {
  state: number;
  throwHeight: number;
  destination: number;
}

export interface BuilderState {
  groundState: number;
  currentState: number;
  steps: BuilderStep[];
  visitedStates: Set<number>;
}

type BuilderAction =
  | { type: "CHOOSE_THROW"; throwHeight: number; destination: number }
  | { type: "UNDO" }
  | { type: "RESET"; groundState: number };

function createInitialState(groundState: number): BuilderState {
  return {
    groundState,
    currentState: groundState,
    steps: [],
    visitedStates: new Set([groundState]),
  };
}

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "CHOOSE_THROW": {
      const step: BuilderStep = {
        state: state.currentState,
        throwHeight: action.throwHeight,
        destination: action.destination,
      };
      const newVisited = new Set(state.visitedStates);
      newVisited.add(action.destination);
      return {
        ...state,
        currentState: action.destination,
        steps: [...state.steps, step],
        visitedStates: newVisited,
      };
    }
    case "UNDO": {
      if (state.steps.length === 0) return state;
      const newSteps = state.steps.slice(0, -1);
      const newCurrent =
        newSteps.length > 0 ? newSteps[newSteps.length - 1].destination : state.groundState;
      const newVisited = new Set([state.groundState]);
      for (const step of newSteps) {
        newVisited.add(step.destination);
      }
      return {
        ...state,
        currentState: newCurrent,
        steps: newSteps,
        visitedStates: newVisited,
      };
    }
    case "RESET":
      return createInitialState(action.groundState);
  }
}

export function useBuilderReducer(groundState: number) {
  return useReducer(builderReducer, groundState, createInitialState);
}
