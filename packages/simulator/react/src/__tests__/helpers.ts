import { mock } from "bun:test";

type MockSimulator = ReturnType<typeof createMockSimulator>;

const createMockSimulator = () => ({
  start: mock(() => {}),
  stop: mock(() => {}),
  setSiteswap: mock(() => {}),
  setNumHands: mock(() => {}),
  setBeatDuration: mock(() => {}),
  setDwellRatio: mock(() => {}),
  setArcPeakPosition: mock(() => {}),
  setColors: mock(() => {}),
  setBackground: mock(() => {}),
  setForeground: mock(() => {}),
  setShowJuggler: mock(() => {}),
  setRender: mock(() => {}),
  resize: mock(() => {}),
  setThrowHolds: mock(() => {}),
  setThrowValues: mock(() => {}),
  setLoopBeats: mock(() => {}),
});

let activeMock: MockSimulator | null = null;
let factoryOverride: (() => MockSimulator) | null = null;

export const getActiveMock = () => activeMock;

export const resetActiveMock = () => {
  activeMock = null;
  factoryOverride = null;
};

/**
 * Make createSimulator throw an error on the next call.
 * Automatically restores normal behavior after throwing.
 */
export const setFactoryError = (message: string) => {
  factoryOverride = () => {
    factoryOverride = null; // auto-restore
    throw new Error(message);
  };
};

/**
 * Mock the @juggling-tools/simulator module.
 * Must be called at the top level of a test file (hoisted by Bun).
 */
export const setupSimulatorMock = () => {
  mock.module("@juggling-tools/simulator", () => ({
    createSimulator: mock(() => {
      if (factoryOverride) {
        return factoryOverride();
      }
      activeMock = createMockSimulator();
      return activeMock;
    }),
    clearCanvas: mock(() => {}),
    drawBall: mock(() => {}),
    drawHand: mock(() => {}),
    drawJuggler: mock(() => {}),
    DEFAULT_FOREGROUND: "#333333",
  }));
};
