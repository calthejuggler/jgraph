import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useConfig() {
  return useQuery<{ max_max_height: number }>({
    queryKey: ["config"],
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/config`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch config");
      return res.json();
    },
  });
}
