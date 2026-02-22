import { Panel } from "@xyflow/react";

import { Card, CardContent } from "@/components/ui/card";

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
            <span className="text-muted-foreground">States:</span> {nodeCount}
          </span>
          <span>
            <span className="text-muted-foreground">Transitions:</span> {edgeCount}
          </span>
        </CardContent>
      </Card>
    </Panel>
  );
}
