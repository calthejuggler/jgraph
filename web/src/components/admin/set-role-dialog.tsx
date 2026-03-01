import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setRoleSchema, type SetRoleValues } from "@/lib/admin-schemas";
import { useSetRole } from "@/queries/admin";

interface SetRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentRole: "admin" | "user";
}

export function SetRoleDialog({
  open,
  onOpenChange,
  userId,
  userName,
  currentRole,
}: SetRoleDialogProps) {
  const setRoleMutation = useSetRole();

  const form = useForm<SetRoleValues>({
    resolver: zodResolver(setRoleSchema),
    defaultValues: { role: currentRole },
  });

  useEffect(() => {
    form.reset({ role: currentRole });
  }, [currentRole, form]);

  function onSubmit(values: SetRoleValues) {
    if (values.role === currentRole) {
      onOpenChange(false);
      return;
    }
    setRoleMutation.mutate(
      { userId, role: values.role },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) form.reset({ role: currentRole });
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Role</DialogTitle>
          <DialogDescription>Change the role for {userName}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <Controller
            name="role"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="role-select">Role</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="role-select" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={setRoleMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={setRoleMutation.isPending}>
              {setRoleMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
