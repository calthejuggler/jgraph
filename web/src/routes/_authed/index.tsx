import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ABSOLUTE_MAX_HEIGHT } from "@/lib/schemas";

const searchSchema = z.object({
  num_props: z.number().int().min(1).max(ABSOLUTE_MAX_HEIGHT).catch(3),
  max_height: z.number().int().min(1).max(ABSOLUTE_MAX_HEIGHT).catch(5),
});

export const Route = createFileRoute("/_authed/")({
  validateSearch: (search) => searchSchema.parse(search),
});
