import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";

import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { Loader2 } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";
import { computeGraphLayout } from "@/lib/graph-layout";
import type { GraphApiResponse } from "@/lib/graph-types";
import type { GraphsValues } from "@/lib/schemas";

import { graphNodeTypes } from "./graph-node";
import { GraphQueryPanel } from "./graph-query-panel";

interface GraphCanvasProps {
  data: GraphApiResponse | undefined;
  form: UseFormReturn<GraphsValues>;
  onSubmit: (values: GraphsValues) => void;
  isFetching: boolean;
  error: Error | null;
  paramsMatch: boolean;
}

export function GraphCanvas({
  data,
  form,
  onSubmit,
  isFetching,
  error,
  paramsMatch,
}: GraphCanvasProps) {
  const { theme } = useTheme();

  const layout = useMemo(() => {
    if (!data) return null;
    return computeGraphLayout(data);
  }, [data]);

  const key = data ? `${data.num_props}-${data.max_height}` : "empty";

  return (
    <ReactFlow
      key={key}
      defaultNodes={layout?.nodes ?? []}
      defaultEdges={layout?.edges ?? []}
      nodeTypes={graphNodeTypes}
      nodesConnectable={false}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      colorMode={theme}
    >
      <Background variant={BackgroundVariant.Dots} />
      <Controls />
      <MiniMap />
      <GraphQueryPanel
        form={form}
        onSubmit={onSubmit}
        isFetching={isFetching}
        error={error}
        nodeCount={data?.num_nodes}
        edgeCount={data?.num_edges}
        paramsMatch={paramsMatch}
      />
      {!data && !isFetching && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground text-lg">Submit a query to visualize the graph</p>
        </div>
      )}
      {!data && isFetching && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-lg">Loading graph...</p>
          </div>
        </div>
      )}
      {data && isFetching && (
        <div className="bg-background/50 pointer-events-none absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      )}
    </ReactFlow>
  );
}
