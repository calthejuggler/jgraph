import { computeGraphLayout } from "@/lib/graph-layout";
import type { GraphApiResponse } from "@/lib/graph-types";

export interface LayoutRequest {
  id: number;
  data: GraphApiResponse;
}

export interface LayoutResponse {
  id: number;
  layout: ReturnType<typeof computeGraphLayout>;
}

self.onmessage = (event: MessageEvent<LayoutRequest>) => {
  const { id, data } = event.data;
  const layout = computeGraphLayout(data);
  self.postMessage({ id, layout } satisfies LayoutResponse);
};
