import { describe, expect, test } from "bun:test";

import { Ball, Canvas, Hand, Hands, Juggler, Root, Simulator, useSimulator } from "../index.js";

describe("public API", () => {
  test("Simulator namespace contains all compound components", () => {
    expect(Simulator.Root).toBe(Root);
    expect(Simulator.Canvas).toBe(Canvas);
    expect(Simulator.Juggler).toBe(Juggler);
    expect(Simulator.Hands).toBe(Hands);
    expect(Simulator.Hand).toBe(Hand);
    expect(Simulator.Ball).toBe(Ball);
  });

  test("named exports are defined", () => {
    expect(Root).toBeDefined();
    expect(typeof Canvas).toBe("function");
    expect(typeof Juggler).toBe("function");
    expect(typeof Hands).toBe("function");
    expect(typeof Hand).toBe("function");
    expect(typeof Ball).toBe("function");
    expect(typeof useSimulator).toBe("function");
  });

  test("re-exports DEFAULT_FOREGROUND from core", async () => {
    const mod = await import("../index.js");
    expect(typeof mod.DEFAULT_FOREGROUND).toBe("string");
  });
});
