import { useState } from "react";

import { BanUserDialog } from "@/components/admin/ban-user-dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { SetRoleDialog } from "@/components/admin/set-role-dialog";
import { UserSessionsDialog } from "@/components/admin/user-sessions-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useImpersonateUser, useRemoveUser, useUnbanUser } from "@/queries/admin";

import { m } from "@/paraglide/messages.js";

interface UserActionsDropdownProps {
  userId: string;
  userName: string;
  userRole: "admin" | "user";
  isBanned: boolean;
  isSelf: boolean;
}

type DialogType = "ban" | "role" | "sessions" | "remove" | null;

export function UserActionsDropdown({
  userId,
  userName,
  userRole,
  isBanned,
  isSelf,
}: UserActionsDropdownProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const impersonate = useImpersonateUser();
  const unban = useUnbanUser();
  const removeUser = useRemoveUser();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            {m.admin_actions()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setActiveDialog("role")}>
            {m.admin_set_role()}
          </DropdownMenuItem>
          {isBanned ? (
            <DropdownMenuItem onClick={() => unban.mutate(userId)}>
              {m.admin_unban()}
            </DropdownMenuItem>
          ) : (
            !isSelf && (
              <DropdownMenuItem onClick={() => setActiveDialog("ban")}>
                {m.admin_ban()}
              </DropdownMenuItem>
            )
          )}
          {!isSelf && !isBanned && (
            <DropdownMenuItem onClick={() => impersonate.mutate(userId)}>
              {m.admin_impersonate()}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setActiveDialog("sessions")}>
            {m.admin_view_sessions()}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => setActiveDialog("remove")}>
            {m.admin_remove_user()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SetRoleDialog
        open={activeDialog === "role"}
        onOpenChange={(v) => !v && setActiveDialog(null)}
        userId={userId}
        userName={userName}
        currentRole={userRole}
      />
      <BanUserDialog
        open={activeDialog === "ban"}
        onOpenChange={(v) => !v && setActiveDialog(null)}
        userId={userId}
        userName={userName}
      />
      <UserSessionsDialog
        open={activeDialog === "sessions"}
        onOpenChange={(v) => !v && setActiveDialog(null)}
        userId={userId}
        userName={userName}
      />
      <ConfirmDialog
        open={activeDialog === "remove"}
        onOpenChange={(v) => !v && setActiveDialog(null)}
        title={m.admin_remove_user()}
        description={m.admin_remove_confirm({ userName })}
        onConfirm={() => removeUser.mutate(userId, { onSuccess: () => setActiveDialog(null) })}
        isPending={removeUser.isPending}
      />
    </>
  );
}
