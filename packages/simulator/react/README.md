# @juggling-tools/simulator-react

React bindings for [`@juggling-tools/simulator`](../core). Provides a compound component API for declaratively rendering animated juggling patterns on a canvas. See it in action at [jugglingtools.com](https://jugglingtools.com).

## Installation

```bash
npm install @juggling-tools/simulator-react @juggling-tools/simulator react react-dom
```

## Quick start

```tsx
import { Simulator } from "@juggling-tools/simulator-react";

const App = () => (
  <Simulator.Root siteswap="531" autoStart>
    <Simulator.Canvas style={{ width: "100%", height: 400 }}>
      <Simulator.Juggler />
      <Simulator.Ball color="red" />
      <Simulator.Ball color="green" />
      <Simulator.Ball color="blue" />
    </Simulator.Canvas>
  </Simulator.Root>
);
```

## Components

### `<Simulator.Root>`

Provider that manages the simulator lifecycle. Wraps everything else.

| Prop              | Type                   | Default     | Description                     |
| ----------------- | ---------------------- | ----------- | ------------------------------- |
| `siteswap`        | `string`               | required    | Siteswap pattern (e.g. `"531"`) |
| `autoStart`       | `boolean`              | `true`      | Start animating on mount        |
| `beatDuration`    | `number`               | `360`       | Milliseconds per beat           |
| `dwellRatio`      | `number`               | `0.6`       | Fraction of beat spent in hand  |
| `arcPeakPosition` | `number`               | `0.55`      | Throw arc peak skew             |
| `background`      | `string`               | `"#111111"` | Canvas background color         |
| `onError`         | `(err: Error) => void` | -           | Called on siteswap parse errors |

Supports `ref` for imperative control via `SimulatorHandle`:

```tsx
const ref = useRef<SimulatorHandle>(null);

<Simulator.Root ref={ref} siteswap="3" autoStart={false}>
  {/* ... */}
</Simulator.Root>;

ref.current?.start();
ref.current?.setSiteswap("441");
```

### `<Simulator.Canvas>`

Renders the `<canvas>` element. Accepts standard HTML canvas props (`style`, `className`, etc.). Auto-resizes via `ResizeObserver` when `width`/`height` are not set.

### `<Simulator.Juggler>`

Configures the stick-figure juggler. Place inside `Canvas`. Renders nothing to the DOM.

Pass a render function as children for custom drawing:

```tsx
<Simulator.Juggler>
  {({ ctx, width, height, handPositions }) => {
    // draw your own juggler
  }}
</Simulator.Juggler>
```

### `<Simulator.Hands>` / `<Simulator.Hand>`

Configure hand rendering. `Hands` is the container; `Hand` children define per-hand renderers.

```tsx
<Simulator.Hands count={2}>
  <Simulator.Hand>
    {({ ctx, position, canvasWidth }) => {
      /* custom hand */
    }}
  </Simulator.Hand>
</Simulator.Hands>
```

If the pattern has more hands than `Hand` children, renderers cycle.

### `<Simulator.Ball>`

Configures a ball. `color` is required. Define one per ball, or fewer to cycle.

```tsx
<Simulator.Ball color="#ff6600" />
<Simulator.Ball color="#00ccff">
  {({ ctx, position, color, canvasWidth }) => { /* custom ball */ }}
</Simulator.Ball>
```

## Hook

### `useSimulator()`

Access simulator state from any component inside `Root`:

```tsx
const { siteswap, setSiteswap, start, stop, isRunning, error } = useSimulator();
```

## Examples

For a full example with custom ball renderers, custom juggler drawing, and playback controls via the `useSimulator` hook, see the [simulator demo page](https://github.com/calthejuggler/juggling-tools/blob/main/web/src/pages/simulator.tsx).

## Peer dependencies

- `react` ^18 or ^19
- `react-dom` ^18 or ^19
- `@juggling-tools/simulator` >=0.1.0

## License

MIT
