import { queryOptions, useQuery } from "@tanstack/react-query";

import { API_URL } from "@/lib/api";
import type { ThrowsApiResponse } from "@/lib/throws-types";

interface ThrowsParams {
  state: number;
  max_height: number;
}

export const throwsQueries = {
  all: () => ["throws"] as const,
  gets: () => [...throwsQueries.all(), "get"] as const,
  get: (params: ThrowsParams) =>
    queryOptions({
      queryKey: [...throwsQueries.gets(), params] as const,
      staleTime: Infinity,
      retry: (_failureCount: number, error: Error) =>
        !error.message.startsWith("Too many requests"),
      queryFn: async () => {
        const searchParams = new URLSearchParams({
          state: String(params.state),
          max_height: String(params.max_height),
          compact: "true",
        });

        const res = await fetch(`${API_URL}/api/v1/state-notation/throws?${searchParams}`, {
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

        return res.json() as Promise<ThrowsApiResponse>;
      },
    }),
};

export function useThrowsQuery(params: ThrowsParams, enabled = true) {
  return useQuery({ ...throwsQueries.get(params), enabled });
}
