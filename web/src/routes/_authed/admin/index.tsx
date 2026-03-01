import { createFileRoute } from "@tanstack/react-router";

import { adminSearchSchema } from "@/lib/admin-schemas";

export const Route = createFileRoute("/_authed/admin/")({
  validateSearch: (search) => adminSearchSchema.parse(search),
});
