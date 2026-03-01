import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { BanUserValues } from "@/lib/admin-schemas";
import { authClient } from "@/lib/auth-client";

import { m } from "@/paraglide/messages.js";

const PAGE_SIZE = 20;

export const adminQueries = {
  all: () => ["admin"] as const,
  users: () => [...adminQueries.all(), "users"] as const,
  userList: (params: {
    search?: string;
    page: number;
    sortBy: string;
    sortDirection: "asc" | "desc";
  }) =>
    queryOptions({
      queryKey: [...adminQueries.users(), params] as const,
      queryFn: async () => {
        const query: Record<string, string | number> = {
          limit: PAGE_SIZE,
          offset: (params.page - 1) * PAGE_SIZE,
          sortBy: params.sortBy,
          sortDirection: params.sortDirection,
        };

        if (params.search) {
          query.searchValue = params.search;
          query.searchField = "email";
          query.searchOperator = "contains";
        }

        const res = await authClient.admin.listUsers({ query });
        if (res.error) throw new Error(res.error.message ?? m.admin_failed_list_users());
        return res.data;
      },
    }),
  sessions: (userId: string) => [...adminQueries.all(), "sessions", userId] as const,
  userSessions: (userId: string) =>
    queryOptions({
      queryKey: adminQueries.sessions(userId),
      queryFn: async () => {
        const res = await authClient.admin.listUserSessions({ userId });
        if (res.error) throw new Error(res.error.message ?? m.admin_failed_list_sessions());
        return res.data;
      },
    }),
};

export { PAGE_SIZE as ADMIN_PAGE_SIZE };

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: adminQueries.users() });
}

export function useBanUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async ({ userId, ...values }: BanUserValues & { userId: string }) => {
      const res = await authClient.admin.banUser({ userId, ...values });
      if (res.error) throw new Error(res.error.message ?? m.admin_failed_ban_user());
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useUnbanUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await authClient.admin.unbanUser({ userId });
      if (res.error) throw new Error(res.error.message ?? m.admin_failed_unban_user());
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useSetRole() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
      const res = await authClient.admin.setRole({ userId, role });
      if (res.error) throw new Error(res.error.message ?? m.admin_failed_set_role());
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await authClient.admin.impersonateUser({ userId });
      if (res.error) throw new Error(res.error.message ?? m.admin_failed_impersonate());
      return res.data;
    },
    onSuccess: () => {
      window.location.assign("/");
    },
  });
}

export function useStopImpersonating() {
  return useMutation({
    mutationFn: async () => {
      const res = await authClient.admin.stopImpersonating();
      if (res.error) throw new Error(res.error.message ?? m.admin_failed_stop_impersonating());
      return res.data;
    },
    onSuccess: () => {
      window.location.assign("/admin");
    },
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionToken, userId }: { sessionToken: string; userId: string }) => {
      const res = await authClient.admin.revokeUserSession({ sessionToken });
      if (res.error) throw new Error(res.error.message ?? m.admin_failed_revoke_session());
      return { ...res.data, userId };
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: adminQueries.sessions(userId) });
    },
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await authClient.admin.revokeUserSessions({ userId });
      if (res.error) throw new Error(res.error.message ?? m.admin_failed_revoke_sessions());
      return res.data;
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: adminQueries.sessions(userId) });
    },
  });
}

export function useRemoveUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await authClient.admin.removeUser({ userId });
      if (res.error) throw new Error(res.error.message ?? m.admin_failed_remove_user());
      return res.data;
    },
    onSuccess: invalidate,
  });
}
