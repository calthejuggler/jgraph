import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { UserActionsDropdown } from "@/components/admin/user-actions-dropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useSession } from "@/lib/auth-client";
import { ADMIN_PAGE_SIZE, adminQueries } from "@/queries/admin";
import { Route } from "@/routes/_authed/admin/index";

export function AdminUsersPage() {
  const { data: session } = useSession();
  const { search, page, sortBy, sortDirection } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [searchInput, setSearchInput] = useState(search ?? "");
  const [prevSearch, setPrevSearch] = useState(search);

  if (search !== prevSearch) {
    setPrevSearch(search);
    setSearchInput(search ?? "");
  }

  const { data, isLoading, error } = useQuery(
    adminQueries.userList({ search, page, sortBy, sortDirection }),
  );

  const debouncedSearch = useDebouncedCallback((value: string) => {
    navigate({
      search: (prev) => ({ ...prev, search: value || undefined, page: 1 }),
      replace: true,
    });
  }, 300);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  }

  function handleSort(field: "name" | "email" | "createdAt") {
    navigate({
      search: (prev) => ({
        ...prev,
        sortBy: field,
        sortDirection: prev.sortBy === field && prev.sortDirection === "asc" ? "desc" : "asc",
      }),
      replace: true,
    });
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Users</h2>
        <span className="text-muted-foreground text-sm">{total} total</span>
      </div>

      <Input
        placeholder="Search by email..."
        value={searchInput}
        onChange={handleSearchChange}
        className="max-w-sm"
      />

      {error ? (
        <p className="text-destructive text-sm">{error.message}</p>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead
                    field="name"
                    current={sortBy}
                    direction={sortDirection}
                    onClick={handleSort}
                  >
                    Name
                  </SortableHead>
                  <SortableHead
                    field="email"
                    current={sortBy}
                    direction={sortDirection}
                    onClick={handleSort}
                  >
                    Email
                  </SortableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <SortableHead
                    field="createdAt"
                    current={sortBy}
                    direction={sortDirection}
                    onClick={handleSort}
                  >
                    Created
                  </SortableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users?.length ? (
                  data.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role ?? "user"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.banned ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="destructive" className="cursor-default">
                                  Banned
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {user.banExpires
                                    ? `Until ${new Date(user.banExpires).toLocaleString()}`
                                    : "Permanent"}
                                </p>
                                {user.banReason && (
                                  <p className="text-muted mt-1 italic">{user.banReason}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <UserActionsDropdown
                          userId={user.id}
                          userName={user.name}
                          userRole={(user.role ?? "user") as "admin" | "user"}
                          isBanned={!!user.banned}
                          isSelf={user.id === session?.user?.id}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  navigate({ search: (prev) => ({ ...prev, page: prev.page - 1 }), replace: true })
                }
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  navigate({ search: (prev) => ({ ...prev, page: prev.page + 1 }), replace: true })
                }
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SortableHead({
  field,
  current,
  direction,
  onClick,
  children,
}: {
  field: "name" | "email" | "createdAt";
  current: string;
  direction: string;
  onClick: (field: "name" | "email" | "createdAt") => void;
  children: React.ReactNode;
}) {
  return (
    <TableHead className="cursor-pointer select-none" onClick={() => onClick(field)}>
      <span className="inline-flex items-center gap-1">
        {children}
        {current === field && <span className="text-xs">{direction === "asc" ? "↑" : "↓"}</span>}
      </span>
    </TableHead>
  );
}
