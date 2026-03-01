import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

const HOME_SEARCH = { num_props: 3, max_height: 5, view: "graph" } as const;

export const Route = createFileRoute("/_authed/admin")({
  beforeLoad: ({ context }) => {
    if ((context as { session?: { user?: { role?: string } } }).session?.user?.role !== "admin")
      throw redirect({ to: "/", search: HOME_SEARCH });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
