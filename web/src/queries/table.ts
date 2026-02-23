import { queryOptions, useQuery } from "@tanstack/react-query";

import { API_URL } from "@/lib/api";
import type { GraphsValues } from "@/lib/schemas";
import type { TableApiResponse } from "@/lib/table-types";

export const tableQueries = {
  all: () => ["table"] as const,
  gets: () => [...tableQueries.all(), "get"] as const,
  get: (params: GraphsValues) =>
    queryOptions({
      queryKey: [...tableQueries.gets(), params] as const,
      staleTime: Infinity,
      retry: (_failureCount: number, error: Error) =>
        !error.message.startsWith("Too many requests"),
      queryFn: async () => {
        const searchParams = new URLSearchParams({
          num_props: String(params.num_props),
          max_height: String(params.max_height),
          compact: "true",
        });

        const res = await fetch(`${API_URL}/api/v1/state-notation/table?${searchParams}`, {
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

        return res.json() as Promise<TableApiResponse>;
      },
    }),
};

export function useTableQuery(params: GraphsValues, enabled: boolean) {
  return useQuery({ ...tableQueries.get(params), enabled });
}
