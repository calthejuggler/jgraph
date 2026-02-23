import { queryOptions, useQuery } from "@tanstack/react-query";

import { API_URL } from "@/lib/api";

export const configQueries = {
  all: () => ["config"] as const,
  gets: () => [...configQueries.all(), "get"] as const,
  get: () =>
    queryOptions({
      queryKey: [...configQueries.gets()] as const,
      staleTime: Infinity,
      queryFn: async () => {
        const res = await fetch(`${API_URL}/api/v1/config`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch config");
        return res.json() as Promise<{ max_max_height: number }>;
      },
    }),
};

export function useConfigQuery() {
  return useQuery(configQueries.get());
}
