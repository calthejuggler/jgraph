import { computeGraphLayout } from "@/lib/graph-layout";
import type { GraphApiResponse } from "@/lib/graph-types";

export interface LayoutRequest {
  id: number;
  data: GraphApiResponse;
  reversed: boolean;
  abbreviated: boolean;
}

export interface LayoutResponse {
  id: number;
  layout: ReturnType<typeof computeGraphLayout>;
}

self.onmessage = (event: MessageEvent<LayoutRequest>) => {
  const { id, data, reversed, abbreviated } = event.data;
  const layout = computeGraphLayout(data, reversed, abbreviated);
  self.postMessage({ id, layout } satisfies LayoutResponse);
};
