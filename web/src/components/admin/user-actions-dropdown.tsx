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
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setActiveDialog("role")}>Set Role</DropdownMenuItem>
          {isBanned ? (
            <DropdownMenuItem onClick={() => unban.mutate(userId)}>Unban</DropdownMenuItem>
          ) : (
            !isSelf && (
              <DropdownMenuItem onClick={() => setActiveDialog("ban")}>Ban</DropdownMenuItem>
            )
          )}
          {!isSelf && !isBanned && (
            <DropdownMenuItem onClick={() => impersonate.mutate(userId)}>
              Impersonate
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setActiveDialog("sessions")}>
            View Sessions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => setActiveDialog("remove")}>
            Remove User
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
        title="Remove User"
        description={`Are you sure you want to permanently remove ${userName}? This action cannot be undone.`}
        onConfirm={() => removeUser.mutate(userId, { onSuccess: () => setActiveDialog(null) })}
        isPending={removeUser.isPending}
      />
    </>
  );
}
