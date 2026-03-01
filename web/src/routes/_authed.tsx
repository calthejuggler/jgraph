import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useMatches,
  useRouteContext,
} from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";

import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { API_URL } from "@/lib/api";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const GRAPH_SEARCH = { num_props: 3, max_height: 5, view: "graph" } as const;
const BUILDER_SEARCH = { num_props: 3, max_height: 5 } as const;
const ADMIN_SEARCH = { page: 1, sortBy: "createdAt", sortDirection: "desc" } as const;

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const res = await fetch(`${API_URL}/api/auth/get-session`, { credentials: "include" });
    if (!res.ok) throw redirect({ to: "/login" });
    const data = await res.json();
    if (!data?.session) throw redirect({ to: "/login" });
    return { session: data };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { session } = useRouteContext({ from: "/_authed" });
  const { theme, toggleTheme } = useTheme();
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? "/";

  const isAdmin = session?.user?.role === "admin";
  const isImpersonating = !!session?.session?.impersonatedBy;

  return (
    <div className="flex h-screen flex-col">
      {isImpersonating && session?.user && (
        <ImpersonationBanner name={session.user.name} email={session.user.email} />
      )}
      <header className="border-border bg-card border-b">
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <h1 className="text-lg font-semibold">Juggling Tools</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {session?.user && (
                <DropdownMenuLabel>{session.user.name || session.user.email}</DropdownMenuLabel>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/" search={GRAPH_SEARCH}>
                  State Graphs
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/builder" search={BUILDER_SEARCH}>
                  Siteswap Builder
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" search={ADMIN_SEARCH}>
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? "Light" : "Dark"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut().then(() => window.location.assign("/login"))}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Desktop header */}
        <div className="hidden grid-cols-3 items-center px-4 py-3 md:grid">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Juggling Tools</h1>
          </div>
          <nav className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(currentPath === "/" && "bg-accent")}
            >
              <Link to="/" search={GRAPH_SEARCH}>
                State Graphs
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(currentPath === "/builder" && "bg-accent")}
            >
              <Link to="/builder" search={BUILDER_SEARCH}>
                Siteswap Builder
              </Link>
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(currentPath.startsWith("/admin") && "bg-accent")}
              >
                <Link to="/admin" search={ADMIN_SEARCH}>
                  Admin Panel
                </Link>
              </Button>
            )}
          </nav>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
            {session?.user && (
              <span className="text-muted-foreground text-sm">
                {session.user.name || session.user.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut().then(() => window.location.assign("/login"))}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
