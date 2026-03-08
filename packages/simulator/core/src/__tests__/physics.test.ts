import { describe, expect, test } from "bun:test";

import {
  computeBallPositions,
  effectiveHeight,
  getHandPositions,
  HAND_Y_RATIO,
} from "../physics.js";
import type { BallSchedule } from "../schedule.js";

describe("effectiveHeight", () => {
  test("portrait canvas returns canvas height", () => {
    // 300/0.714 = 420 < 600, so height wins
    expect(effectiveHeight(300, 600)).toBe(600);
  });

  test("landscape canvas returns width / (10/14)", () => {
    const result = effectiveHeight(800, 400);
    expect(result).toBe(800 / (10 / 14)); // 1120
  });

  test("square canvas boundary", () => {
    const result = effectiveHeight(500, 500);
    expect(result).toBe(500 / (10 / 14)); // 700
  });
});

describe("getHandPositions", () => {
  const W = 400;
  const H = 600;

  test("2 hands: symmetric around center", () => {
    const hands = getHandPositions(W, H, 2);
    expect(hands).toHaveLength(2);
    const centerX = W / 2;
    expect(hands[0].x).toBeGreaterThan(centerX);
    expect(hands[1].x).toBeLessThan(centerX);
    expect(hands[0].x - centerX).toBeCloseTo(centerX - hands[1].x);
  });

  test("2 hands: correct Y position", () => {
    const hands = getHandPositions(W, H, 2);
    const eh = effectiveHeight(W, H);
    const expectedY = H - eh * (1 - HAND_Y_RATIO);
    expect(hands[0].y).toBeCloseTo(expectedY);
    expect(hands[1].y).toBeCloseTo(expectedY);
  });

  test("1 hand: centered", () => {
    const hands = getHandPositions(W, H, 1);
    expect(hands).toHaveLength(1);
    expect(hands[0].x).toBe(W / 2);
  });

  test("3 hands: correct count and evenly distributed", () => {
    const hands = getHandPositions(W, H, 3);
    expect(hands).toHaveLength(3);
    // Even spacing
    const gap01 = hands[1].x - hands[0].x;
    const gap12 = hands[2].x - hands[1].x;
    expect(gap01).toBeCloseTo(gap12);
  });

  test("Y position consistent with HAND_Y_RATIO", () => {
    const hands = getHandPositions(W, H, 3);
    const eh = effectiveHeight(W, H);
    const expectedY = H - eh * (1 - HAND_Y_RATIO);
    for (const hand of hands) {
      expect(hand.y).toBeCloseTo(expectedY);
    }
  });
});

describe("computeBallPositions", () => {
  const handPositions = [
    { x: 250, y: 500 },
    { x: 150, y: 500 },
  ];

  const physics = {
    beatDuration: 360,
    dwellRatio: 0.6,
    arcSkewExponent: 1,
    heightPerThrow: 30,
    numHands: 2,
    throwHolds: false,
  };

  test("ball at hand position during dwell phase", () => {
    const balls: BallSchedule[] = [
      {
        id: 0,
        color: "red",
        throwEvents: [{ ballId: 0, fromHand: 0, toHand: 1, throwValue: 3, throwBeat: 0 }],
      },
    ];
    // elapsed=100 < dwellEnd=216, so ball is in dwell phase at fromHand
    const positions = computeBallPositions(balls, 100, handPositions, physics);
    expect(positions).toHaveLength(1);
    expect(positions[0].position).toEqual(handPositions[0]);
    expect(positions[0].color).toBe("red");
  });

  test("ball in flight between hands during arc phase", () => {
    const balls: BallSchedule[] = [
      {
        id: 0,
        color: "red",
        throwEvents: [{ ballId: 0, fromHand: 0, toHand: 1, throwValue: 3, throwBeat: 0 }],
      },
    ];
    // release=216, land=1080, mid-flight
    const elapsed = 600;
    const positions = computeBallPositions(balls, elapsed, handPositions, physics);
    expect(positions).toHaveLength(1);
    const pos = positions[0].position;
    expect(pos.x).not.toBe(handPositions[0].x);
    expect(pos.x).not.toBe(handPositions[1].x);
    // above the hands (y increases downward)
    expect(pos.y).toBeLessThan(handPositions[0].y);
  });

  test("ball at destination hand after landing", () => {
    const balls: BallSchedule[] = [
      {
        id: 0,
        color: "red",
        throwEvents: [{ ballId: 0, fromHand: 0, toHand: 1, throwValue: 3, throwBeat: 0 }],
      },
    ];
    // elapsed=1100 is after land (1080), ball should be at toHand
    const positions = computeBallPositions(balls, 1100, handPositions, physics);
    expect(positions).toHaveLength(1);
    expect(positions[0].position).toEqual(handPositions[1]);
  });

  test("returns position for each ball", () => {
    const balls: BallSchedule[] = [
      {
        id: 0,
        color: "red",
        throwEvents: [{ ballId: 0, fromHand: 0, toHand: 1, throwValue: 3, throwBeat: 0 }],
      },
      {
        id: 1,
        color: "green",
        throwEvents: [{ ballId: 1, fromHand: 1, toHand: 0, throwValue: 3, throwBeat: 1 }],
      },
    ];
    const positions = computeBallPositions(balls, 100, handPositions, physics);
    expect(positions).toHaveLength(2);
    expect(positions[0].color).toBe("red");
    expect(positions[1].color).toBe("green");
  });

  test("balls without events default to initial hand", () => {
    const balls: BallSchedule[] = [
      { id: 0, color: "red", throwEvents: [] },
      { id: 1, color: "green", throwEvents: [] },
    ];
    const positions = computeBallPositions(balls, 100, handPositions, physics);
    // ball.id % numHands determines default hand
    expect(positions[0].position).toEqual(handPositions[0]);
    expect(positions[1].position).toEqual(handPositions[1]);
  });

  test("hold throws with throwHolds=false: ball stays at fromHand", () => {
    const balls: BallSchedule[] = [
      {
        id: 0,
        color: "red",
        throwEvents: [{ ballId: 0, fromHand: 0, toHand: 0, throwValue: 2, throwBeat: 0 }],
      },
    ];
    // throwValue === numHands → hold, ball stays at fromHand
    const elapsed = 500;
    const positions = computeBallPositions(balls, elapsed, handPositions, physics);
    expect(positions[0].position).toEqual(handPositions[0]);
  });
});
