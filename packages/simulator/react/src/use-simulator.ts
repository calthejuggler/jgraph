import { useSimulatorContext } from "./context.js";

/**
 * Hook for accessing the simulator state and controls from within a `<Simulator.Root>`.
 *
 * Returns the current siteswap, playback controls, running state, and any
 * parse/validation error. Must be called inside a `<Simulator.Root>` component tree.
 *
 * @example
 * ```tsx
 * const { siteswap, setSiteswap, start, stop, isRunning, error } = useSimulator();
 * ```
 *
 * @throws If called outside of a `<Simulator.Root>`.
 */
export const useSimulator = () => {
  const { siteswap, setSiteswap, start, stop, isRunning, error } = useSimulatorContext();
  return { siteswap, setSiteswap, start, stop, isRunning, error };
};
