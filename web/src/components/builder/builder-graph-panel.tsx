import { useMemo } from "react";

import { Background, BackgroundVariant, Controls, MarkerType, ReactFlow } from "@xyflow/react";

import type { BuilderState } from "@/hooks/use-builder-reducer";
import { useTheme } from "@/hooks/use-theme";
import { toBinaryLabel } from "@/lib/binary-label";
import { builderStateToGraphData } from "@/lib/builder-graph-data";
import { computeGraphLayout } from "@/lib/graph-layout";
import type { GraphEdge, GraphNode } from "@/lib/graph-types";

import { graphEdgeTypes } from "../graph/graph-edge";
import { graphNodeTypes } from "../graph/graph-node";

const FIT_VIEW_OPTIONS = { padding: 0.2 } as const;
const DEFAULT_EDGE_OPTIONS = { markerEnd: { type: MarkerType.ArrowClosed } } as const;
const EMPTY_NODES: GraphNode[] = [];
const EMPTY_EDGES: GraphEdge[] = [];

interface BuilderGraphPanelProps {
  state: BuilderState;
  maxHeight: number;
  numProps: number;
}

export function BuilderGraphPanel({ state, maxHeight, numProps }: BuilderGraphPanelProps) {
  const { theme } = useTheme();

  const { nodes, edges } = useMemo(() => {
    if (state.visitedStates.size === 0) {
      return { nodes: EMPTY_NODES, edges: EMPTY_EDGES };
    }

    const graphData = builderStateToGraphData(state, maxHeight, numProps);
    const layout = computeGraphLayout(graphData, false, false);

    const currentLabel = toBinaryLabel(state.currentState, maxHeight, false);
    const annotatedNodes = layout.nodes.map((node) =>
      node.id === currentLabel ? { ...node, data: { ...node.data, isCurrent: true } } : node,
    );

    return { nodes: annotatedNodes, edges: layout.edges };
  }, [state, maxHeight, numProps]);

  const key = `builder-${state.steps.length}-${state.currentState}`;

  return (
    <ReactFlow
      key={key}
      defaultNodes={nodes}
      defaultEdges={edges}
      nodeTypes={graphNodeTypes}
      edgeTypes={graphEdgeTypes}
      nodesConnectable={false}
      edgesFocusable={false}
      nodesFocusable={false}
      elementsSelectable={false}
      defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
      fitView
      fitViewOptions={FIT_VIEW_OPTIONS}
      colorMode={theme}
    >
      <Background variant={BackgroundVariant.Dots} />
      <Controls />
    </ReactFlow>
  );
}
