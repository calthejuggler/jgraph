import type { BallSchedule, ThrowEvent } from "./schedule.js";
import type { Vec2 } from "./types.js";

const HAND_Y_RATIO = 0.85;
const HAND_SPREAD_RATIO = 0.18;
const PARABOLIC_SCALE_FACTOR = 4;
const LOG_BASE = 0.5;

export type BallPosition = {
  readonly position: Vec2;
  readonly color: string;
};

export type PhysicsConfig = {
  readonly beatDuration: number;
  readonly dwellRatio: number;
  readonly arcPeakPosition: number;
  readonly heightPerThrow: number;
};

export const getHandPositions = (canvasWidth: number, canvasHeight: number, numHands: number) => {
  const centerX = canvasWidth / 2;
  const handY = canvasHeight * HAND_Y_RATIO;
  const spread = canvasWidth * HAND_SPREAD_RATIO;

  if (numHands === 2) {
    return [
      { x: centerX + spread, y: handY },
      { x: centerX - spread, y: handY },
    ];
  }

  const positions: Vec2[] = [];
  for (let i = 0; i < numHands; i++) {
    const t = numHands === 1 ? 0.5 : i / (numHands - 1);
    positions.push({
      x: centerX - spread + t * spread * 2,
      y: handY,
    });
  }
  return positions;
};

export const computeBallPositions = (
  balls: readonly BallSchedule[],
  elapsed: number,
  handPositions: readonly Vec2[],
  physics: PhysicsConfig,
) => {
  const result: BallPosition[] = [];
  for (const ball of balls) {
    const position = findBallPosition(ball.throwEvents, elapsed, handPositions, physics);
    if (position) {
      result.push({ position, color: ball.color });
    }
  }
  return result;
};

const findBallPosition = (
  throwEvents: readonly ThrowEvent[],
  elapsed: number,
  handPositions: readonly Vec2[],
  physics: PhysicsConfig,
) => {
  const { beatDuration, dwellRatio, heightPerThrow, arcPeakPosition } = physics;

  for (let i = throwEvents.length - 1; i >= 0; i--) {
    const event = throwEvents[i];
    const throwTime = event.throwBeat * beatDuration;
    const landTime = (event.throwBeat + event.throwValue) * beatDuration;
    const nextDwellEnd =
      i < throwEvents.length - 1
        ? (throwEvents[i + 1].throwBeat + dwellRatio) * beatDuration
        : landTime + dwellRatio * beatDuration;

    if (elapsed >= throwTime && elapsed <= nextDwellEnd) {
      const releaseTime = (event.throwBeat + dwellRatio) * beatDuration;

      if (elapsed <= releaseTime) {
        const hand = handPositions[event.fromHand];
        return { x: hand.x, y: hand.y };
      }

      if (elapsed <= landTime) {
        const from = handPositions[event.fromHand];
        const to = handPositions[event.toHand];
        const flightDuration = landTime - releaseTime;
        const progress = (elapsed - releaseTime) / flightDuration;
        const peakHeight = event.throwValue * heightPerThrow;
        return parabolicPosition(from, to, progress, peakHeight, arcPeakPosition);
      }

      const hand = handPositions[event.toHand];
      return { x: hand.x, y: hand.y };
    }
  }

  if (throwEvents.length > 0) {
    const firstEvent = throwEvents[0];
    const firstThrowTime = firstEvent.throwBeat * beatDuration;
    if (elapsed < firstThrowTime) {
      return handPositions[firstEvent.fromHand];
    }
  }

  return null;
};

const parabolicPosition = (
  from: Vec2,
  to: Vec2,
  progress: number,
  peakHeight: number,
  peakPos: number,
) => {
  const height = peakHeight * PARABOLIC_SCALE_FACTOR * progress * (1 - progress);
  const k = Math.log(peakPos) / Math.log(LOG_BASE);
  const xProgress = Math.pow(progress, k);
  return {
    x: from.x + (to.x - from.x) * xProgress,
    y: from.y + (to.y - from.y) * xProgress - height,
  };
};
