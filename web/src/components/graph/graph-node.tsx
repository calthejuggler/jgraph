import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { GraphNode } from "@/lib/graph-types";

function GraphNodeComponent({ data }: NodeProps<GraphNode>) {
  return (
    <div
      className={
        data.isCurrent
          ? "rounded-md border-3 border-blue-500 bg-blue-500 px-3 py-2 text-center font-mono text-sm text-white ring-4 ring-blue-500/30"
          : data.isBase
            ? "bg-primary text-primary-foreground border-primary/40 rounded-md border-3 px-3 py-2 text-center font-mono text-sm"
            : "bg-card text-card-foreground border-border rounded-md border px-3 py-2 text-center font-mono text-sm"
      }
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      {data.label}
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  );
}

export const graphNodeTypes = { graphNode: GraphNodeComponent };
