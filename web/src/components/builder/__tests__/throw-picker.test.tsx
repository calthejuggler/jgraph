import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, mock } from "bun:test";

import type { ThrowOption } from "@/lib/throws-types";

import { ThrowPicker } from "../throw-picker";

mock.module("@/paraglide/messages.js", () => ({
  m: new Proxy({}, { get: () => () => "stub" }),
}));

const makeProps = (overrides?: Partial<Parameters<typeof ThrowPicker>[0]>) => ({
  throws: undefined as ThrowOption[] | undefined,
  isFetching: false,
  error: null as Error | null,
  currentState: 7,
  groundState: 7,
  maxHeight: 3,
  visitedStates: new Set<number>([7]),
  onChooseThrow: mock(() => {}),
  ...overrides,
});

afterEach(cleanup);

describe("ThrowPicker", () => {
  it("shows the current state as a binary label", () => {
    render(<ThrowPicker {...makeProps()} />);
    expect(screen.getByText("111", { selector: "p" })).toBeTruthy();
  });

  it("renders throw buttons when throws are provided", () => {
    const throws: ThrowOption[] = [
      { height: 3, destination: 7 },
      { height: 5, destination: 14 },
    ];
    render(<ThrowPicker {...makeProps({ throws })} />);
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("calls onChooseThrow with height and destination on click", () => {
    const onChooseThrow = mock(() => {});
    const throws: ThrowOption[] = [{ height: 3, destination: 7 }];
    render(<ThrowPicker {...makeProps({ throws, onChooseThrow })} />);

    screen.getByText("3").closest("button")!.click();
    expect(onChooseThrow).toHaveBeenCalledWith(3, 7);
  });

  it("shows error message when error is present", () => {
    render(<ThrowPicker {...makeProps({ error: new Error("Something broke") })} />);
    expect(screen.getByText("Something broke")).toBeTruthy();
  });

  it("shows destination binary label on each throw button", () => {
    const throws: ThrowOption[] = [{ height: 3, destination: 5 }];
    render(<ThrowPicker {...makeProps({ throws })} />);
    expect(screen.getByText("101")).toBeTruthy();
  });
});
