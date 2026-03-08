import { describe, expect, test } from "bun:test";

import { computeSchedule, computeScheduleForPartial } from "../schedule.js";

const COLORS = ["red", "green", "blue", "yellow"];

describe("computeSchedule", () => {
  test("creates correct number of balls for [3]", () => {
    const balls = computeSchedule([3], 2, 10, COLORS);
    expect(balls).toHaveLength(3);
  });

  test("creates correct number of balls for [5,3,1]", () => {
    const balls = computeSchedule([5, 3, 1], 2, 10, COLORS);
    expect(balls).toHaveLength(3);
  });

  test("ball colors cycle through provided color array", () => {
    const colors = ["red", "green"];
    const balls = computeSchedule([3], 2, 10, colors);
    expect(balls[0].color).toBe("red");
    expect(balls[1].color).toBe("green");
    expect(balls[2].color).toBe("red"); // cycles
  });

  test("ball ids are sequential", () => {
    const balls = computeSchedule([3], 2, 10, COLORS);
    expect(balls.map((b) => b.id)).toEqual([0, 1, 2]);
  });

  test("throw events have correct fromHand based on beat % numHands", () => {
    const balls = computeSchedule([3], 2, 10, COLORS);
    const allEvents = balls.flatMap((b) => b.throwEvents);
    for (const event of allEvents) {
      expect(event.fromHand).toBe(event.throwBeat % 2);
    }
  });

  test("toHand = (throwBeat + throwValue) % numHands", () => {
    const balls = computeSchedule([5, 3, 1], 2, 20, COLORS);
    const allEvents = balls.flatMap((b) => b.throwEvents);
    for (const event of allEvents) {
      expect(event.toHand).toBe((event.throwBeat + event.throwValue) % 2);
    }
  });

  test("toHand correct with 3 hands", () => {
    const balls = computeSchedule([3], 3, 15, COLORS);
    const allEvents = balls.flatMap((b) => b.throwEvents);
    for (const event of allEvents) {
      expect(event.toHand).toBe((event.throwBeat + event.throwValue) % 3);
    }
  });

  test("schedule extends when existing is provided", () => {
    const initial = computeSchedule([3], 2, 10, COLORS);
    const totalInitialEvents = initial.reduce((sum, b) => sum + b.throwEvents.length, 0);

    const extended = computeSchedule([3], 2, 20, COLORS, initial);
    const totalExtendedEvents = extended.reduce((sum, b) => sum + b.throwEvents.length, 0);

    expect(totalExtendedEvents).toBeGreaterThan(totalInitialEvents);
    for (let i = 0; i < initial.length; i++) {
      for (let j = 0; j < initial[i].throwEvents.length; j++) {
        expect(extended[i].throwEvents[j]).toEqual(initial[i].throwEvents[j]);
      }
    }
  });

  test("throwBeat values are monotonically increasing per ball", () => {
    const balls = computeSchedule([5, 3, 1], 2, 30, COLORS);
    for (const ball of balls) {
      for (let i = 1; i < ball.throwEvents.length; i++) {
        expect(ball.throwEvents[i].throwBeat).toBeGreaterThan(ball.throwEvents[i - 1].throwBeat);
      }
    }
  });

  test("hold throws (throwValue === numHands) are scheduled", () => {
    // [2] with 2 hands means every throw is a hold (value 2, 2 hands)
    const balls = computeSchedule([2], 2, 10, COLORS);
    const allEvents = balls.flatMap((b) => b.throwEvents);
    for (const event of allEvents) {
      expect(event.throwValue).toBe(2);
      expect(event.toHand).toBe(event.fromHand); // lands in same hand
    }
  });

  test("zero throws produce no events for that beat", () => {
    // [5,0,4] — beat 1 (the 0) should not generate throw events
    const balls = computeSchedule([5, 0, 4], 2, 15, COLORS);
    const allEvents = balls.flatMap((b) => b.throwEvents);
    const beat1Events = allEvents.filter((e) => e.throwBeat % 3 === 1);
    expect(beat1Events).toHaveLength(0);
  });
});

describe("computeScheduleForPartial", () => {
  test("creates exactly ballCount balls", () => {
    const balls = computeScheduleForPartial([5, 3, 1], 3, 2, 10, COLORS);
    expect(balls).toHaveLength(3);
  });

  test("creates balls regardless of throw values", () => {
    const balls = computeScheduleForPartial([1], 5, 2, 10, COLORS);
    expect(balls).toHaveLength(5);
  });

  test("distributes balls across hands initially", () => {
    const balls = computeScheduleForPartial([3, 3, 3], 3, 2, 10, COLORS);
    const firstEvents = balls.map((b) => b.throwEvents[0]?.fromHand);
    expect(firstEvents[0]).toBe(0);
    expect(firstEvents[1]).toBe(1);
    expect(firstEvents[2]).toBe(0);
  });

  test("beyond throw values length, remaining beats are treated as 0s", () => {
    const balls = computeScheduleForPartial([3], 1, 2, 10, COLORS);
    const allEvents = balls.flatMap((b) => b.throwEvents);
    const eventsAfterBeat0 = allEvents.filter((e) => e.throwBeat > 0 && e.throwValue !== 0);
    expect(eventsAfterBeat0).toHaveLength(0);
  });

  test("ball colors cycle through provided array", () => {
    const colors = ["a", "b"];
    const balls = computeScheduleForPartial([3], 3, 2, 10, colors);
    expect(balls[0].color).toBe("a");
    expect(balls[1].color).toBe("b");
    expect(balls[2].color).toBe("a");
  });
});
