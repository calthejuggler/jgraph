import type { BuilderStep } from "@/hooks/use-builder-reducer";
import { toBinaryLabel } from "@/lib/binary-label";
import { toSiteswapChar } from "@/lib/siteswap-notation";
import { cn } from "@/lib/utils";

import { m } from "@/paraglide/messages.js";

interface PatternSequenceProps {
  steps: BuilderStep[];
  groundState: number;
  maxHeight: number;
  visitedStatesBefore: Set<number>[];
}

export function PatternSequence({
  steps,
  groundState,
  maxHeight,
  visitedStatesBefore,
}: PatternSequenceProps) {
  if (steps.length === 0) {
    return <p className="text-muted-foreground text-sm">{m.builder_choose_prompt()}</p>;
  }

  const siteswap = steps.map((s) => toSiteswapChar(s.throwHeight)).join(" ");

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        <div className="min-w-0 flex-1 space-y-1 overflow-x-auto">
          {steps.map((step, i) => {
            const fromLabel = toBinaryLabel(step.state, maxHeight, false);
            const toLabel = toBinaryLabel(step.destination, maxHeight, false);

            return (
              <div key={i} className="flex w-max items-center gap-1.5 font-mono text-xs">
                <span className="text-muted-foreground">{fromLabel}</span>
                <span className="text-muted-foreground">→</span>
                <span className="w-9 text-center font-bold">
                  {toSiteswapChar(step.throwHeight)}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground">{toLabel}</span>
              </div>
            );
          })}
        </div>
        <div className="flex shrink-0 flex-col justify-start space-y-1">
          {steps.map((step, i) => {
            const wasVisited = visitedStatesBefore[i]?.has(step.destination) ?? false;
            const isGroundLoop = wasVisited && step.destination === groundState;

            return (
              <div key={i} className="flex items-center font-mono text-xs">
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    wasVisited
                      ? isGroundLoop
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400"
                      : "invisible",
                  )}
                >
                  {m.builder_loop_back()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-muted-foreground text-xs">{m.builder_siteswap()}</p>
        <p className="font-mono text-sm font-semibold">{siteswap}</p>
      </div>
    </div>
  );
}
