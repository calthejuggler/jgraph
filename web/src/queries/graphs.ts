import { queryOptions, useQuery } from "@tanstack/react-query";

import { API_URL } from "@/lib/api";
import type { GraphApiResponse } from "@/lib/graph-types";
import type { GraphsValues } from "@/lib/schemas";

export const graphQueries = {
  all: () => ["graphs"] as const,
  gets: () => [...graphQueries.all(), "get"] as const,
  get: (params: GraphsValues) =>
    queryOptions({
      queryKey: [...graphQueries.gets(), params] as const,
      staleTime: Infinity,
      retry: (_failureCount: number, error: Error) =>
        !error.message.startsWith("Too many requests"),
      queryFn: async () => {
        const searchParams = new URLSearchParams({
          num_props: String(params.num_props),
          max_height: String(params.max_height),
          compact: "true",
        });

        const res = await fetch(`${API_URL}/api/v1/graphs?${searchParams}`, {
          credentials: "include",
        });

        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
          throw new Error(`Too many requests. Please try again in ${seconds} seconds.`);
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with status ${res.status}`);
        }

        return res.json() as Promise<GraphApiResponse>;
      },
    }),
};

export function useGraphQuery(params: GraphsValues) {
  return useQuery(graphQueries.get(params));
}
