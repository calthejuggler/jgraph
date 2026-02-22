import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { GraphNode } from "@/lib/graph-types";

function GraphNodeComponent({ data }: NodeProps<GraphNode>) {
  return (
    <div
      className={
        data.isBase
          ? "bg-primary text-primary-foreground ring-primary/40 rounded-md px-3 py-2 text-center font-mono text-sm shadow-md ring-4"
          : "bg-card text-card-foreground border-border rounded-md border px-3 py-2 text-center font-mono text-sm shadow-sm"
      }
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      {data.label}
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  );
}

export const graphNodeTypes = { graphNode: GraphNodeComponent };
