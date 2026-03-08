import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "bun:test";

import { useTheme } from "../use-theme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  test("defaults to light theme", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  test("toggleTheme switches to dark", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
  });

  test("toggleTheme from dark returns to light", () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");
  });

  test("applies dark class to document.documentElement", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
