import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminQueries, useRevokeAllSessions, useRevokeSession } from "@/queries/admin";

import { m } from "@/paraglide/messages.js";

interface UserSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function UserSessionsDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: UserSessionsDialogProps) {
  const { data, isLoading } = useQuery({
    ...adminQueries.userSessions(userId),
    enabled: open,
  });
  const revokeSession = useRevokeSession();
  const revokeAll = useRevokeAllSessions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{m.admin_sessions_title({ userName })}</DialogTitle>
          <DialogDescription>{m.admin_sessions_description()}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : data?.sessions?.length ? (
          <>
            <div className="max-h-80 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{m.admin_sessions_user_agent()}</TableHead>
                    <TableHead>{m.admin_sessions_ip()}</TableHead>
                    <TableHead>{m.admin_sessions_created()}</TableHead>
                    <TableHead>{m.admin_sessions_expires()}</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="max-w-48 truncate text-xs">
                        {session.userAgent ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs">{session.ipAddress ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(session.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            revokeSession.mutate({ sessionToken: session.token, userId })
                          }
                          disabled={revokeSession.isPending}
                        >
                          {m.admin_sessions_revoke()}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => revokeAll.mutate(userId)}
                disabled={revokeAll.isPending}
              >
                {revokeAll.isPending ? m.admin_sessions_revoking() : m.admin_sessions_revoke_all()}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground py-4 text-center text-sm">
            {m.admin_sessions_none()}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
