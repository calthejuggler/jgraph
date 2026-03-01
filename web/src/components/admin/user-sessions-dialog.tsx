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
          <DialogTitle>Sessions for {userName}</DialogTitle>
          <DialogDescription>View and manage active sessions.</DialogDescription>
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
                    <TableHead>User Agent</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
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
                          Revoke
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
                {revokeAll.isPending ? "Revoking..." : "Revoke All Sessions"}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground py-4 text-center text-sm">No active sessions.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
