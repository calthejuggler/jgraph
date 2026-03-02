import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { GRAPH_SEARCH } from "@/routes/_authed";

const searchSchema = z.object({
  error: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (!search.error) {
      throw redirect({ to: "/", search: GRAPH_SEARCH });
    }
  },
});
