# @juggling-tools/simulator

Browser-based siteswap juggling pattern animator. Pass a siteswap string and a canvas element, and it renders an animated stick-figure juggler throwing and catching balls along parabolic arcs. See it in action at [jugglingtools.com](https://jugglingtools.com).

## Installation

```bash
npm install @juggling-tools/simulator
```

## Quick start

```js
import { createSimulator } from "@juggling-tools/simulator";

const canvas = document.querySelector("canvas");
const sim = createSimulator(canvas, { siteswap: "531" });
sim.start();
```

## Options

```ts
createSimulator(canvas, {
  siteswap: "531", // required, base-36 siteswap string
  numHands: 2, // default: 2
  beatDuration: 360, // ms per beat (default: 360)
  dwellRatio: 0.6, // fraction of beat the ball stays in hand (0-1)
  arcPeakPosition: 0.55, // horizontal skew of throw arc peak (0-1)
  colors: ["red", "green", "blue"], // ball colors (cycles if fewer than balls)
  background: "#111111", // canvas background color
  showJuggler: true, // draw stick figure
  render: (ctx, w, h, frame) => {
    /* custom renderer */
  },
});
```

## Runtime control

The `createSimulator` call returns a `Simulator` handle:

```ts
sim.start();
sim.stop();
sim.setSiteswap("441");
sim.setNumHands(4);
sim.setBeatDuration(300);
sim.setDwellRatio(0.5);
sim.setArcPeakPosition(0.6);
sim.setColors(["#ff0000", "#00ff00"]);
sim.setBackground("#000");
sim.setShowJuggler(false);
sim.setRender(customFn); // or null to restore default
sim.resize(); // recalculate after canvas resize
```

Changes to `siteswap`, `numHands`, and `colors` rebuild the throw schedule and restart the animation. Everything else applies live.

## Custom rendering

Pass a `render` function to take full control of drawing. You receive pre-computed frame data:

```ts
type FrameData = {
  background: string;
  showJuggler: boolean;
  handPositions: Vec2[];
  balls: BallPosition[]; // { position: Vec2, color: string }
};
```

The default renderer's drawing primitives are also exported for mix-and-match use:

```ts
import { drawBall, drawHand, drawJuggler } from "@juggling-tools/simulator";
```

## Examples

For a full working example with vanilla JS, see [`demo.html`](./demo.html).

For a React integration with custom renderers (glow balls, spinning squares, custom juggler), see the [simulator demo page](https://github.com/calthejuggler/juggling-tools/blob/main/web/src/pages/simulator.tsx) in the main app, or check out [`@juggling-tools/simulator-react`](../react).

## License

MIT
