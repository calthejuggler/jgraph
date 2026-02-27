import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toBinaryLabel } from "@/lib/binary-label";
import type { ThrowOption } from "@/lib/throws-types";
import { cn } from "@/lib/utils";

interface ThrowPickerProps {
  throws: ThrowOption[] | undefined;
  isFetching: boolean;
  error: Error | null;
  currentState: number;
  groundState: number;
  maxHeight: number;
  visitedStates: Set<number>;
  onChooseThrow: (throwHeight: number, destination: number) => void;
}

export function ThrowPicker({
  throws,
  isFetching,
  error,
  currentState,
  groundState,
  maxHeight,
  visitedStates,
  onChooseThrow,
}: ThrowPickerProps) {
  const currentLabel = toBinaryLabel(currentState, maxHeight, false);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">Current state</p>
        <p className="font-mono text-lg font-semibold">{currentLabel}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Choose a throw</p>
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </div>

        {error && (
          <p className="text-destructive text-xs">{error.message || "Failed to load throws"}</p>
        )}

        {throws && (
          <div className="grid grid-cols-3 gap-2">
            {throws.map((t) => {
              const isLoop = visitedStates.has(t.destination);
              const isGroundLoop = isLoop && t.destination === groundState;
              const destLabel = toBinaryLabel(t.destination, maxHeight, false);

              return (
                <Button
                  key={t.height}
                  variant="outline"
                  className={cn(
                    "flex h-auto flex-col gap-0.5 py-2",
                    isGroundLoop &&
                      "border-green-500/50 bg-green-500/10 hover:bg-green-500/20 dark:border-green-400/50 dark:bg-green-400/10 dark:hover:bg-green-400/20",
                    isLoop &&
                      !isGroundLoop &&
                      "border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 dark:border-amber-400/50 dark:bg-amber-400/10 dark:hover:bg-amber-400/20",
                  )}
                  onClick={() => onChooseThrow(t.height, t.destination)}
                >
                  <span className="text-lg font-bold">{t.height}</span>
                  <span className="text-muted-foreground font-mono text-xs">{destLabel}</span>
                  {isLoop && (
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        isGroundLoop
                          ? "text-green-600 dark:text-green-400"
                          : "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      ↻ loop
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
