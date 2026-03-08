import { describe, expect, test } from "bun:test";

import { computeInitialState, numBalls, parseSiteswap } from "../siteswap.js";

describe("parseSiteswap", () => {
  test("parses simple numeric patterns", () => {
    expect(parseSiteswap("531")).toEqual([5, 3, 1]);
  });

  test("parses single digit", () => {
    expect(parseSiteswap("3")).toEqual([3]);
  });

  test("parses base-36 characters", () => {
    expect(parseSiteswap("b")).toEqual([11]);
    expect(parseSiteswap("a")).toEqual([10]);
    expect(parseSiteswap("f")).toEqual([15]);
    expect(parseSiteswap("z")).toEqual([35]);
  });

  test("parses mixed digits and letters", () => {
    expect(parseSiteswap("b97531")).toEqual([11, 9, 7, 5, 3, 1]);
  });

  test("parses 0", () => {
    expect(parseSiteswap("0")).toEqual([0]);
  });

  test("returns empty array for empty string", () => {
    expect(parseSiteswap("")).toEqual([]);
  });

  test("throws on space", () => {
    expect(() => parseSiteswap(" ")).toThrow("Invalid siteswap character");
  });

  test("throws on period", () => {
    expect(() => parseSiteswap(".")).toThrow("Invalid siteswap character");
  });

  test("throws on exclamation mark", () => {
    expect(() => parseSiteswap("!")).toThrow("Invalid siteswap character");
  });

  test("throws on dollar sign", () => {
    expect(() => parseSiteswap("$")).toThrow("Invalid siteswap character");
  });

  test("is case-insensitive (base-36 parseInt)", () => {
    expect(parseSiteswap("B")).toEqual([11]);
    expect(parseSiteswap("A")).toEqual([10]);
  });
});

describe("numBalls", () => {
  test("cascade [5,3,1] returns 3", () => {
    expect(numBalls([5, 3, 1])).toBe(3);
  });

  test("basic [3] returns 3", () => {
    expect(numBalls([3])).toBe(3);
  });

  test("[0] returns 0", () => {
    expect(numBalls([0])).toBe(0);
  });

  test("[5,5,5] returns 5", () => {
    expect(numBalls([5, 5, 5])).toBe(5);
  });

  test("throws on empty array", () => {
    expect(() => numBalls([])).toThrow("Empty siteswap");
  });

  test("throws when average is not integer", () => {
    expect(() => numBalls([5, 3, 2])).toThrow("average is not an integer");
  });
});

describe("computeInitialState", () => {
  test("[3] returns correct occupancy", () => {
    const state = computeInitialState([3]);
    expect(state).toHaveLength(3);
    expect(state.filter(Boolean)).toHaveLength(3);
  });

  test("[5,3,1] returns correct occupancy", () => {
    const state = computeInitialState([5, 3, 1]);
    expect(state).toHaveLength(5); // max throw value
    expect(state.filter(Boolean)).toHaveLength(3); // numBalls = 3
  });

  test("[0] returns empty array", () => {
    expect(computeInitialState([0])).toEqual([]);
  });

  test("length equals max throw value", () => {
    const state = computeInitialState([7, 5, 3]);
    expect(state).toHaveLength(7);
  });

  test("[4,4] returns correct occupancy", () => {
    const state = computeInitialState([4, 4]);
    expect(state).toHaveLength(4);
    expect(state.filter(Boolean)).toHaveLength(4);
  });
});
