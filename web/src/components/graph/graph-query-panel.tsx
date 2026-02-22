import { useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

import { Panel } from "@xyflow/react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MAX_MAX_HEIGHT, type GraphsValues } from "@/lib/schemas";

interface GraphQueryPanelProps {
  form: UseFormReturn<GraphsValues>;
  onSubmit: (values: GraphsValues) => void;
  isFetching: boolean;
  error: Error | null;
  nodeCount?: number;
  edgeCount?: number;
  paramsMatch: boolean;
}

export function GraphQueryPanel({
  form,
  onSubmit,
  isFetching,
  error,
  nodeCount,
  edgeCount,
  paramsMatch,
}: GraphQueryPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Panel position="top-left">
      <Card className="w-72 shadow-lg">
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          <span className="text-sm font-semibold">
            Query
            {nodeCount != null && edgeCount != null && (
              <span className="text-muted-foreground ml-2 font-normal">
                {nodeCount}n / {edgeCount}e
              </span>
            )}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        {!collapsed && (
          <CardContent className="pt-3">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  name="num_props"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="num_props">Props</FieldLabel>
                      <Input
                        id="num_props"
                        type="number"
                        min={1}
                        max={MAX_MAX_HEIGHT}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="max_height"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="max_height">Max height</FieldLabel>
                      <Input
                        id="max_height"
                        type="number"
                        min={1}
                        max={MAX_MAX_HEIGHT}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="w-full"
                variant={paramsMatch && !isFetching ? "outline" : "default"}
                disabled={isFetching || paramsMatch}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="animate-spin" /> Loading...
                  </>
                ) : paramsMatch ? (
                  "Up to date"
                ) : (
                  "Query"
                )}
              </Button>
              {error && (
                <p className="text-destructive text-xs">
                  {error instanceof Error ? error.message : "Request failed"}
                </p>
              )}
            </form>
          </CardContent>
        )}
      </Card>
    </Panel>
  );
}
