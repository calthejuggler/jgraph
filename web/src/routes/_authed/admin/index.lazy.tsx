import { createLazyFileRoute } from "@tanstack/react-router";

import { AdminUsersPage } from "@/pages/admin/users";

export const Route = createLazyFileRoute("/_authed/admin/")({
  component: AdminUsersPage,
});
