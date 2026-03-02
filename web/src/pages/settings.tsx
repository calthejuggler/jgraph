import { useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/schemas";

import { m } from "@/paraglide/messages.js";

export function SettingsPage() {
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema()),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordValues) {
    setServerError("");
    setSuccess(false);
    try {
      const res = await authClient.changePassword({
        newPassword: values.newPassword,
        currentPassword: values.currentPassword,
        revokeOtherSessions: true,
      });
      if (res.error) {
        setServerError(res.error.message ?? m.auth_unexpected_error());
      } else {
        setSuccess(true);
        form.reset();
      }
    } catch {
      setServerError(m.auth_unexpected_error());
    }
  }

  return (
    <div className="flex justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{m.auth_change_password_title()}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="currentPassword"
              control={form.control}
              label={m.auth_current_password_label()}
              type="password"
              placeholder={m.auth_current_password_placeholder()}
              autoComplete="current-password"
            />
            <FormField
              name="newPassword"
              control={form.control}
              label={m.auth_new_password_label()}
              type="password"
              placeholder={m.auth_new_password_placeholder()}
              autoComplete="new-password"
            />
            <FormField
              name="confirmPassword"
              control={form.control}
              label={m.auth_confirm_password_label()}
              type="password"
              placeholder={m.auth_confirm_password_placeholder()}
              autoComplete="new-password"
            />
            {serverError && (
              <p role="alert" className="text-destructive text-sm">
                {serverError}
              </p>
            )}
            {success && (
              <p role="status" className="text-success text-sm">
                {m.auth_change_password_success()}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? m.auth_change_password_changing()
                : m.auth_change_password_submit()}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
