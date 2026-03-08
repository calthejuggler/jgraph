import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, mock } from "bun:test";

import type { BuilderStep } from "@/hooks/use-builder-reducer";

import { PatternSequence } from "../pattern-sequence";

mock.module("@/paraglide/messages.js", () => ({
  m: new Proxy({}, { get: () => () => "stub" }),
}));

const step = (state: number, throwHeight: number, destination: number): BuilderStep => ({
  state,
  throwHeight,
  destination,
});

afterEach(cleanup);

describe("PatternSequence", () => {
  it("shows a prompt when steps are empty", () => {
    render(<PatternSequence steps={[]} groundState={7} maxHeight={3} visitedStatesBefore={[]} />);
    expect(screen.getByText("stub")).toBeTruthy();
  });

  it("renders siteswap notation for given steps", () => {
    const steps = [step(7, 3, 7), step(7, 5, 7)];
    render(
      <PatternSequence
        steps={steps}
        groundState={7}
        maxHeight={3}
        visitedStatesBefore={[new Set([7]), new Set([7])]}
      />,
    );
    expect(screen.getByText("3 5")).toBeTruthy();
  });

  it("renders binary state labels for each step", () => {
    const steps = [step(7, 3, 7)];
    render(
      <PatternSequence
        steps={steps}
        groundState={7}
        maxHeight={3}
        visitedStatesBefore={[new Set([7])]}
      />,
    );
    const labels = screen.getAllByText("111");
    expect(labels.length).toBe(2);
  });
});
