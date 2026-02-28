import { queryOptions, useQuery } from "@tanstack/react-query";

import { API_URL } from "@/lib/api";
import type { GraphApiResponse } from "@/lib/graph-types";
import type { GraphsValues } from "@/lib/schemas";

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const graphQueries = {
  all: () => ["graphs"] as const,
  gets: () => [...graphQueries.all(), "get"] as const,
  get: (params: GraphsValues) =>
    queryOptions({
      queryKey: [...graphQueries.gets(), params] as const,
      staleTime: Infinity,
      retry: (_failureCount: number, error: Error) => {
        if (error instanceof HttpError) {
          // Only retry server errors (5xx), not client errors (4xx)
          return error.status >= 500;
        }
        return true;
      },
      queryFn: async () => {
        const searchParams = new URLSearchParams({
          num_props: String(params.num_props),
          max_height: String(params.max_height),
          compact: "true",
        });

        const res = await fetch(`${API_URL}/api/v1/state-notation/graph?${searchParams}`, {
          credentials: "include",
        });

        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
          throw new HttpError(429, `Too many requests. Please try again in ${seconds} seconds.`);
        }

        if (!res.ok) {
          const text = await res.text();
          let message = text || `Request failed with status ${res.status}`;
          try {
            const json = JSON.parse(text);
            if (json.error) message = json.error;
          } catch {
            // JSON parse failed; keep original text as message
          }
          throw new HttpError(res.status, message);
        }

        return res.json() as Promise<GraphApiResponse>;
      },
    }),
};

export function useGraphQuery(params: GraphsValues, enabled = true) {
  return useQuery({ ...graphQueries.get(params), enabled });
}
