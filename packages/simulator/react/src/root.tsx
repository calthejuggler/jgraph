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

export type SimulatorHandle = {
  readonly start: () => void;
  readonly stop: () => void;
  readonly setSiteswap: (siteswap: string) => void;
};

type RootProps = {
  siteswap: string;
  beatDuration?: number;
  dwellRatio?: number;
  arcPeakPosition?: number;
  background?: string;
  autoStart?: boolean;
  onError?: (error: Error) => void;
  children: React.ReactNode;
};

export const Root = forwardRef<SimulatorHandle, RootProps>(
  (
    {
      siteswap,
      beatDuration,
      dwellRatio,
      arcPeakPosition,
      background,
      autoStart = true,
      onError,
      children,
    },
    ref,
  ) => {
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const [simulator, setSimulator] = useState<Simulator | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentSiteswap, setCurrentSiteswap] = useState(siteswap);

    const registerCanvas = setCanvas;

    const [prevSiteswapProp, setPrevSiteswapProp] = useState(siteswap);
    if (siteswap !== prevSiteswapProp) {
      setPrevSiteswapProp(siteswap);
      setCurrentSiteswap(siteswap);
    }

    const optionsRef = useRef({
      currentSiteswap,
      beatDuration,
      dwellRatio,
      arcPeakPosition,
      background,
      autoStart,
      onError,
    });
    optionsRef.current = {
      currentSiteswap,
      beatDuration,
      dwellRatio,
      arcPeakPosition,
      background,
      autoStart,
      onError,
    };

    useEffect(() => {
      if (!canvas) return;

      const opts = optionsRef.current;
      try {
        const sim = createSimulator(canvas, {
          siteswap: opts.currentSiteswap,
          beatDuration: opts.beatDuration,
          dwellRatio: opts.dwellRatio,
          arcPeakPosition: opts.arcPeakPosition,
          background: opts.background,
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
    }, [canvas]);

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
      if (background !== undefined) simulator?.setBackground(background);
    }, [background, simulator]);

    useEffect(() => {
      if (!simulator) return;
      try {
        simulator.setSiteswap(currentSiteswap);
        setError(null);
      } catch (e) {
        const err = toError(e);
        setError(err);
        optionsRef.current.onError?.(err);
      }
    }, [currentSiteswap, simulator]);

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
