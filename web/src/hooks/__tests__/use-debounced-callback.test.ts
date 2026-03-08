import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, mock } from "bun:test";

import { useDebouncedCallback } from "../use-debounced-callback";

describe("useDebouncedCallback", () => {
  it("does not call immediately", () => {
    const fn = mock(() => {});
    const { result } = renderHook(() => useDebouncedCallback(fn, 100));

    result.current();
    expect(fn).not.toHaveBeenCalled();
  });

  it("calls after the delay", async () => {
    const fn = mock(() => {});
    const { result } = renderHook(() => useDebouncedCallback(fn, 50));

    act(() => result.current());

    await new Promise((r) => setTimeout(r, 60));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("resets the timer on subsequent calls", async () => {
    const fn = mock(() => {});
    const { result } = renderHook(() => useDebouncedCallback(fn, 50));

    act(() => result.current());
    await new Promise((r) => setTimeout(r, 30));
    act(() => result.current());
    await new Promise((r) => setTimeout(r, 30));

    expect(fn).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 30));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("forwards arguments to the callback", async () => {
    const fn = mock<(a: number, b: string) => void>(() => {});
    const { result } = renderHook(() => useDebouncedCallback(fn, 50));

    act(() => result.current(42, "hello"));

    await new Promise((r) => setTimeout(r, 60));
    expect(fn).toHaveBeenCalledWith(42, "hello");
  });

  it("uses the latest arguments when debounced", async () => {
    const fn = mock<(v: number) => void>(() => {});
    const { result } = renderHook(() => useDebouncedCallback(fn, 50));

    act(() => {
      result.current(1);
      result.current(2);
      result.current(3);
    });

    await new Promise((r) => setTimeout(r, 60));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });
});
