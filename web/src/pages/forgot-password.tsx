import { useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";

import { AuthPageLayout } from "@/components/auth-page-layout";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/schemas";

import { m } from "@/paraglide/messages.js";

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema()),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setServerError("");
    try {
      const res = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (res.error) {
        console.error("Password reset request failed:", res.error.code);
      }
      // Always show success to avoid email enumeration
      setSubmitted(true);
    } catch {
      setServerError(m.auth_unexpected_error());
    }
  }

  return (
    <AuthPageLayout title={m.auth_forgot_password_title()}>
      {submitted ? (
        <div className="space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            {m.auth_forgot_password_success()}
          </p>
          <Link to="/login" className="text-primary block text-center text-sm underline">
            {m.auth_back_to_login()}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground mb-4 text-center text-sm">
            {m.auth_forgot_password_description()}
          </p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="email"
              control={form.control}
              label={m.auth_email_label()}
              type="email"
              placeholder={m.auth_email_placeholder()}
              autoComplete="email"
            />
            {serverError && (
              <p role="alert" className="text-destructive text-sm">
                {serverError}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? m.auth_forgot_password_sending()
                : m.auth_forgot_password_submit()}
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
