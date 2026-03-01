import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import type { BanUserValues } from "@/lib/admin-schemas";
import { useBanUser } from "@/queries/admin";

import { m } from "@/paraglide/messages.js";

const DURATION_OPTIONS = [
  { label: m.admin_ban_duration_1h(), value: "3600" },
  { label: m.admin_ban_duration_1d(), value: "86400" },
  { label: m.admin_ban_duration_1w(), value: "604800" },
  { label: m.admin_ban_duration_1m(), value: "2592000" },
  { label: m.admin_ban_duration_permanent(), value: "permanent" },
] as const;

const durationSchema = z.enum(["3600", "86400", "604800", "2592000", "permanent"]);

type FormValues = {
  banReason: string;
  duration: z.infer<typeof durationSchema>;
};

const formSchema = z.object({
  banReason: z.string(),
  duration: durationSchema,
});

interface BanUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function BanUserDialog({ open, onOpenChange, userId, userName }: BanUserDialogProps) {
  const banUser = useBanUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { banReason: "", duration: "permanent" },
  });

  function onSubmit(values: FormValues) {
    const payload: BanUserValues & { userId: string } = {
      userId,
      banReason: values.banReason || undefined,
      banExpiresIn: values.duration !== "permanent" ? Number(values.duration) : undefined,
    };

    banUser.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) form.reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.admin_ban_title()}</DialogTitle>
          <DialogDescription>{m.admin_ban_description({ userName })}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <Controller
            name="banReason"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ban-reason">{m.admin_ban_reason_label()}</FieldLabel>
                <Textarea
                  {...field}
                  id="ban-reason"
                  placeholder={m.admin_ban_reason_placeholder()}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="duration"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ban-duration">{m.admin_ban_duration_label()}</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="ban-duration" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
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
              disabled={banUser.isPending}
            >
              {m.common_cancel()}
            </Button>
            <Button type="submit" variant="destructive" disabled={banUser.isPending}>
              {banUser.isPending ? m.admin_banning() : m.admin_ban_title()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
