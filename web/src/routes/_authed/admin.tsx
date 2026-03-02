import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { GRAPH_SEARCH } from "@/routes/_authed";

export const Route = createFileRoute("/_authed/admin")({
  beforeLoad: ({ context }) => {
    if ((context as { session?: { user?: { role?: string } } }).session?.user?.role !== "admin")
      throw redirect({ to: "/", search: GRAPH_SEARCH });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
