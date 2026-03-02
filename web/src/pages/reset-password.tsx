import { useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearch } from "@tanstack/react-router";

import { AuthPageLayout } from "@/components/auth-page-layout";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/schemas";

import { m } from "@/paraglide/messages.js";

export function ResetPasswordPage() {
  const { token, error: urlError } = useSearch({ from: "/reset-password" });
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema()),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setServerError("");
    if (!token) {
      setServerError(m.auth_reset_password_invalid_token());
      return;
    }
    try {
      const res = await authClient.resetPassword({ newPassword: values.password, token });
      if (res.error) {
        setServerError(res.error.message ?? m.auth_reset_password_invalid_token());
      } else {
        setSuccess(true);
      }
    } catch {
      setServerError(m.auth_unexpected_error());
    }
  }

  const hasError = urlError === "INVALID_TOKEN" || (!token && !success);

  return (
    <AuthPageLayout title={m.auth_reset_password_title()}>
      {success ? (
        <div className="space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            {m.auth_reset_password_success()}
          </p>
          <Link to="/login" className="text-primary block text-center text-sm underline">
            {m.auth_back_to_login()}
          </Link>
        </div>
      ) : hasError ? (
        <div className="space-y-4">
          <p className="text-destructive text-center text-sm">
            {m.auth_reset_password_invalid_token()}
          </p>
          <Link to="/forgot-password" className="text-primary block text-center text-sm underline">
            {m.auth_forgot_password_title()}
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="password"
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
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? m.auth_reset_password_resetting()
                : m.auth_reset_password_submit()}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            <Link to="/login" className="text-primary underline">
              {m.auth_back_to_login()}
            </Link>
          </p>
        </>
      )}
    </AuthPageLayout>
  );
}
