import { Ball } from "./ball.js";
import { Canvas } from "./canvas.js";
import { Hand, Hands } from "./hands.js";
import { Juggler } from "./juggler.js";
import { Root } from "./root.js";

export { Root } from "./root.js";
export type { SimulatorHandle } from "./root.js";
export { Canvas } from "./canvas.js";
export { Juggler } from "./juggler.js";
export type { JugglerRenderData, JugglerRenderFn } from "./juggler.js";
export { Hands, Hand } from "./hands.js";
export type { HandRenderData, HandRenderFn } from "./hands.js";
export { Ball } from "./ball.js";
export type { BallRenderData, BallRenderFn } from "./ball.js";
export { useSimulator } from "./use-simulator.js";
export { DEFAULT_FOREGROUND } from "@juggling-tools/simulator";

/**
 * Compound component namespace for the juggling simulator.
 *
 * Use `<Simulator.Root>` as the provider and `<Simulator.Canvas>` to render.
 * Nest `<Simulator.Juggler>`, `<Simulator.Hands>`, `<Simulator.Hand>`, and
 * `<Simulator.Ball>` inside the canvas to declaratively configure rendering.
 *
 * @example
 * ```tsx
 * <Simulator.Root siteswap="531">
 *   <Simulator.Canvas>
 *     <Simulator.Juggler />
 *     <Simulator.Hands />
 *     <Simulator.Ball color="red" />
 *     <Simulator.Ball color="green" />
 *     <Simulator.Ball color="blue" />
 *   </Simulator.Canvas>
 * </Simulator.Root>
 * ```
 */
export const Simulator = {
  /**
   * Root provider component for the juggling simulator.
   *
   * Wraps children in a context that manages the simulator lifecycle. Place a
   * `<Simulator.Canvas>` inside to render the animation, and use declarative
   * children (`<Simulator.Juggler>`, `<Simulator.Ball>`, etc.) or the
   * {@link useSimulator} hook to interact with the simulation.
   *
   * @example
   * ```tsx
   * <Simulator.Root siteswap="531">
   *   <Simulator.Canvas>
   *     <Simulator.Juggler />
   *     <Simulator.Ball color="red" />
   *   </Simulator.Canvas>
   * </Simulator.Root>
   * ```
   */
  Root,
  /**
   * Canvas component that renders the juggling animation.
   *
   * Must be placed inside a `<Simulator.Root>`. Accepts optional declarative children
   * to configure what is drawn. When no children are provided, the default built-in
   * renderer is used. If `width` and `height` are omitted, auto-resizes to fill its parent.
   */
  Canvas,
  /**
   * Declarative juggler configuration component.
   *
   * Place inside `<Simulator.Canvas>` to enable juggler rendering. Pass a child
   * render function to replace the default stick-figure with custom drawing.
   * This is a config-only component — it renders no DOM elements.
   */
  Juggler,
  /**
   * Declarative hands container component.
   *
   * Place inside `<Simulator.Canvas>` to control the number of hands and their
   * rendering. Nest `<Simulator.Hand>` children inside for per-hand custom renderers.
   * This is a config-only component — it renders no DOM elements.
   */
  Hands,
  /**
   * Declarative hand configuration component.
   *
   * Place inside `<Simulator.Hands>` to configure individual hand rendering.
   * Hands are matched by index order, cycling if there are more hands than elements.
   * This is a config-only component — it renders no DOM elements.
   */
  Hand,
  /**
   * Declarative ball configuration component.
   *
   * Place inside `<Simulator.Canvas>` to define each ball's color and optional custom
   * rendering. Balls are matched to the pattern's balls by index order, cycling if
   * there are more pattern balls than elements.
   * This is a config-only component — it renders no DOM elements.
   */
  Ball,
};
