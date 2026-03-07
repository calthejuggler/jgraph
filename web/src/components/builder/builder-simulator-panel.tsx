import { useMemo } from "react";

import { DEFAULT_FOREGROUND, Simulator } from "@juggling-tools/simulator-react";

import type { BuilderState } from "@/hooks/use-builder-reducer";
import { useTheme } from "@/hooks/use-theme";

import { m } from "@/paraglide/messages.js";

interface BuilderSimulatorPanelProps {
  state: BuilderState;
  numProps: number;
}

export function BuilderSimulatorPanel({ state, numProps }: BuilderSimulatorPanelProps) {
  const { theme } = useTheme();
  const foreground = theme === "dark" ? DEFAULT_FOREGROUND : "rgba(0, 0, 0, 0.5)";
  const throwValues = useMemo(() => state.steps.map((s) => s.throwHeight), [state.steps]);

  const isComplete = state.steps.length > 0 && state.currentState === state.groundState;
  const isEmpty = state.steps.length === 0;

  if (isEmpty)
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-center text-sm">
          {m.builder_simulator_placeholder()}
        </p>
      </div>
    );

  if (isComplete) {
    const siteswap = throwValues.map((v) => v.toString(36)).join("");
    return (
      <Simulator.Root
        siteswap={siteswap}
        background="transparent"
        foreground={foreground}
        key={`complete-${siteswap}`}
      >
        <Simulator.Canvas className="h-full w-full" />
      </Simulator.Root>
    );
  }

  return (
    <Simulator.Root
      throwValues={throwValues}
      ballCount={numProps}
      loopBeats={throwValues.length}
      background="transparent"
      foreground={foreground}
      key={`partial-${throwValues.join(",")}-${numProps}`}
    >
      <Simulator.Canvas className="h-full w-full" />
    </Simulator.Root>
  );
}
