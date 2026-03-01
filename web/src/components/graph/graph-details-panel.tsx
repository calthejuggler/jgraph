import { Panel } from "@xyflow/react";

import { Card, CardContent } from "@/components/ui/card";

import { m } from "@/paraglide/messages.js";

interface GraphDetailsPanelProps {
  nodeCount?: number;
  edgeCount?: number;
}

export function GraphDetailsPanel({ nodeCount, edgeCount }: GraphDetailsPanelProps) {
  if (nodeCount == null || edgeCount == null) return null;

  return (
    <Panel position="top-right">
      <Card className="shadow-lg">
        <CardContent className="flex gap-4 px-4 py-2 text-sm">
          <span>
            <span className="text-muted-foreground">{m.graph_states()}</span> {nodeCount}
          </span>
          <span>
            <span className="text-muted-foreground">{m.graph_transitions()}</span> {edgeCount}
          </span>
        </CardContent>
      </Card>
    </Panel>
  );
}
