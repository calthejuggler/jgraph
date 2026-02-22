import dagre from "dagre";

import type { ExpandedGraphResponse, GraphApiResponse, GraphEdge, GraphNode } from "./graph-types";

const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;

function expandCompactResponse(data: GraphApiResponse): ExpandedGraphResponse {
  const { max_height } = data;
  return {
    ...data,
    nodes: data.nodes.map((n) => n.toString(2).padStart(max_height, "0")),
    edges: data.edges.map((e) => ({
      from: e.from.toString(2).padStart(max_height, "0"),
      to: e.to.toString(2).padStart(max_height, "0"),
      throw_height: e.throw_height,
    })),
  };
}

function getBaseNodeId(data: ExpandedGraphResponse): string {
  return "0".repeat(data.max_height - data.num_props) + "1".repeat(data.num_props);
}

export function computeGraphLayout(data: GraphApiResponse): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const expanded = expandCompactResponse(data);
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB" });
  g.setDefaultEdgeLabel(() => ({}));

  const baseId = getBaseNodeId(expanded);

  for (const node of expanded.nodes) {
    g.setNode(node, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of expanded.edges) {
    g.setEdge(edge.from, edge.to);
  }

  dagre.layout(g);

  const nodes: GraphNode[] = expanded.nodes.map((id) => {
    const pos = g.node(id);
    return {
      id,
      type: "graphNode",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { label: id, isBase: id === baseId },
    };
  });

  const edges: GraphEdge[] = expanded.edges.map((edge) => ({
    id: `e-${edge.from}-${edge.to}-${edge.throw_height}`,
    source: edge.from,
    target: edge.to,
    label: String(edge.throw_height),
  }));

  return { nodes, edges };
}
