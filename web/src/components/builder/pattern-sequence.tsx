import type { BuilderStep } from "@/hooks/use-builder-reducer";
import { toBinaryLabel } from "@/lib/binary-label";
import { cn } from "@/lib/utils";

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
    return <p className="text-muted-foreground text-sm">Choose throws to build a pattern.</p>;
  }

  const siteswap = steps.map((s) => s.throwHeight).join(" ");

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {steps.map((step, i) => {
          const fromLabel = toBinaryLabel(step.state, maxHeight, false);
          const toLabel = toBinaryLabel(step.destination, maxHeight, false);
          const wasVisited = visitedStatesBefore[i]?.has(step.destination) ?? false;
          const isGroundLoop = wasVisited && step.destination === groundState;

          return (
            <div key={i} className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-muted-foreground">{fromLabel}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-bold">{step.throwHeight}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-muted-foreground">{toLabel}</span>
              {wasVisited && (
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isGroundLoop
                      ? "text-green-600 dark:text-green-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  ← loop
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-1">
        <p className="text-muted-foreground text-xs">Siteswap</p>
        <p className="font-mono text-sm font-semibold">{siteswap}</p>
      </div>
    </div>
  );
}
