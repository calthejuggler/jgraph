import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Simulator } from "@juggling-tools/simulator";
import { createSimulator } from "@juggling-tools/simulator";

import { SimulatorContext } from "./context.js";

const toError = (e: unknown) => (e instanceof Error ? e : new Error(String(e)));

/**
 * Imperative handle exposed by {@link Root} via `React.forwardRef`.
 *
 * Attach a ref to `<Simulator.Root>` to access these methods for
 * programmatic control outside of React's declarative flow.
 */
export type SimulatorHandle = {
  /** Start the animation. No-op if already running. */
  readonly start: () => void;
  /** Stop the animation. */
  readonly stop: () => void;
  /** Change the siteswap pattern programmatically. */
  readonly setSiteswap: (siteswap: string) => void;
};

type CommonProps = {
  loopBeats?: number;
  beatDuration?: number;
  dwellRatio?: number;
  arcPeakPosition?: number;
  background?: string;
  throwHolds?: boolean;
  autoStart?: boolean;
  onError?: (error: Error) => void;
  children: React.ReactNode;
};

type SiteswapProps = CommonProps & {
  siteswap: string;
  throwValues?: never;
  ballCount?: never;
};

type ThrowValuesProps = CommonProps & {
  siteswap?: never;
  throwValues: number[];
  ballCount: number;
};

type RootProps = SiteswapProps | ThrowValuesProps;

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
 *   <Simulator.Canvas style={{ width: "100%", height: 400 }}>
 *     <Simulator.Juggler />
 *     <Simulator.Hands />
 *     <Simulator.Ball color="red" />
 *     <Simulator.Ball color="green" />
 *     <Simulator.Ball color="blue" />
 *   </Simulator.Canvas>
 * </Simulator.Root>
 * ```
 */
export const Root = forwardRef<SimulatorHandle, RootProps>(
  (
    {
      siteswap,
      throwValues,
      ballCount,
      loopBeats,
      beatDuration,
      dwellRatio,
      arcPeakPosition,
      background,
      throwHolds,
      autoStart = true,
      onError,
      children,
    },
    ref,
  ) => {
    const isPartialMode = throwValues !== undefined;
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const [simulator, setSimulator] = useState<Simulator | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentSiteswap, setCurrentSiteswap] = useState(siteswap ?? "0");

    const registerCanvas = setCanvas;

    const [prevSiteswapProp, setPrevSiteswapProp] = useState(siteswap);
    if (siteswap !== prevSiteswapProp) {
      setPrevSiteswapProp(siteswap);
      if (siteswap !== undefined) setCurrentSiteswap(siteswap);
    }

    const optionsRef = useRef({
      currentSiteswap,
      beatDuration,
      dwellRatio,
      arcPeakPosition,
      background,
      throwHolds,
      autoStart,
      onError,
    });
    optionsRef.current = {
      currentSiteswap,
      beatDuration,
      dwellRatio,
      arcPeakPosition,
      background,
      throwHolds,
      autoStart,
      onError,
    };

    useEffect(() => {
      if (!canvas) return;

      const opts = optionsRef.current;
      try {
        const sim = createSimulator(canvas, {
          siteswap: isPartialMode ? "0" : opts.currentSiteswap,
          beatDuration: opts.beatDuration,
          dwellRatio: opts.dwellRatio,
          arcPeakPosition: opts.arcPeakPosition,
          background: opts.background,
          throwHolds: opts.throwHolds,
        });
        setSimulator(sim);

        if (opts.autoStart) {
          sim.start();
          setIsRunning(true);
        }

        return () => {
          sim.stop();
          setSimulator(null);
          setIsRunning(false);
        };
      } catch (e) {
        const err = toError(e);
        setError(err);
        opts.onError?.(err);
      }
    }, [canvas, isPartialMode]);

    useEffect(() => {
      if (beatDuration !== undefined) simulator?.setBeatDuration(beatDuration);
    }, [beatDuration, simulator]);

    useEffect(() => {
      if (dwellRatio !== undefined) simulator?.setDwellRatio(dwellRatio);
    }, [dwellRatio, simulator]);

    useEffect(() => {
      if (arcPeakPosition !== undefined) simulator?.setArcPeakPosition(arcPeakPosition);
    }, [arcPeakPosition, simulator]);

    useEffect(() => {
      if (throwHolds !== undefined) simulator?.setThrowHolds(throwHolds);
    }, [throwHolds, simulator]);

    useEffect(() => {
      if (background !== undefined) simulator?.setBackground(background);
    }, [background, simulator]);

    useEffect(() => {
      if (!simulator || isPartialMode) return;
      try {
        simulator.setSiteswap(currentSiteswap);
        setError(null);
      } catch (e) {
        const err = toError(e);
        setError(err);
        optionsRef.current.onError?.(err);
      }
    }, [currentSiteswap, simulator, isPartialMode]);

    const throwValuesKey = throwValues?.join(",");
    useEffect(() => {
      if (!simulator || !isPartialMode || throwValuesKey == null) return;
      const values = throwValuesKey.split(",").map(Number);
      simulator.setThrowValues(values, ballCount);
    }, [simulator, isPartialMode, throwValuesKey, ballCount]);

    useEffect(() => {
      if (!simulator) return;
      simulator.setLoopBeats(loopBeats);
    }, [simulator, loopBeats]);

    const applySiteswap = setCurrentSiteswap;

    const start = useCallback(() => {
      if (!simulator) return;
      simulator.start();
      setIsRunning(true);
    }, [simulator]);

    const stop = useCallback(() => {
      if (!simulator) return;
      simulator.stop();
      setIsRunning(false);
    }, [simulator]);

    useImperativeHandle(ref, () => ({ start, stop, setSiteswap: applySiteswap }), [
      start,
      stop,
      applySiteswap,
    ]);

    const contextValue = useMemo(
      () => ({
        simulator,
        registerCanvas,
        siteswap: currentSiteswap,
        setSiteswap: applySiteswap,
        start,
        stop,
        isRunning,
        error,
      }),
      [simulator, registerCanvas, currentSiteswap, applySiteswap, start, stop, isRunning, error],
    );

    return <SimulatorContext.Provider value={contextValue}>{children}</SimulatorContext.Provider>;
  },
);
