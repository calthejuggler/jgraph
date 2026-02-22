import { useSyncExternalStore } from "react";

import type { GraphApiResponse, GraphEdge, GraphNode } from "@/lib/graph-types";
import type { LayoutResponse } from "@/workers/graph-layout.worker";
import GraphLayoutWorker from "@/workers/graph-layout.worker?worker";

interface GraphLayout {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const worker = new GraphLayoutWorker();
const listeners = new Set<() => void>();
let snapshot: LayoutResponse | null = null;

let lastRequestedData: GraphApiResponse | undefined;
let requestId = 0;

worker.addEventListener("message", (event: MessageEvent<LayoutResponse>) => {
  snapshot = event.data;
  listeners.forEach((l) => l());
});

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return snapshot;
}

function requestLayout(data: GraphApiResponse): number {
  if (lastRequestedData === data) return requestId;
  lastRequestedData = data;
  requestId++;
  worker.postMessage({ id: requestId, data });
  return requestId;
}

export function useGraphLayout(data: GraphApiResponse | undefined): GraphLayout | null {
  const currentId = data ? requestLayout(data) : -1;
  const result = useSyncExternalStore(subscribe, getSnapshot);

  if (result?.id !== currentId) return null;

  return result.layout;
}
