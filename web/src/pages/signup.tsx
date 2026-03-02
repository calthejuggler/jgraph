import { useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";

import { AuthPageLayout } from "@/components/auth-page-layout";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/auth-client";
import { signupSchema, type SignupValues } from "@/lib/schemas";

import { m } from "@/paraglide/messages.js";

export function SignupPage() {
  const [serverError, setServerError] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema()),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SignupValues) {
    setServerError("");
    try {
      const res = await signUp.email({
        ...values,
        callbackURL: `${window.location.origin}/verify-email`,
      });
      if (res.error) {
        setServerError(res.error.message ?? m.auth_signup_failed());
      } else {
        setVerificationEmail(values.email);
      }
    } catch {
      setServerError(m.auth_unexpected_error());
    }
  }

  if (verificationEmail) {
    return (
      <AuthPageLayout title={m.auth_check_email_title()}>
        <div className="space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            {m.auth_check_email_description({ email: verificationEmail })}
          </p>
          <Link to="/login" className="text-primary block text-center text-sm underline">
            {m.auth_back_to_login()}
          </Link>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout title={m.auth_create_account()}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="name"
          control={form.control}
          label={m.auth_name_label()}
          placeholder={m.auth_name_placeholder()}
          autoComplete="name"
        />
        <FormField
          name="email"
          control={form.control}
          label={m.auth_email_label()}
          type="email"
          placeholder={m.auth_email_placeholder()}
          autoComplete="email"
        />
        <FormField
          name="password"
          control={form.control}
          label={m.auth_password_label()}
          type="password"
          placeholder={m.auth_password_placeholder_signup()}
          autoComplete="new-password"
        />
        {serverError && (
          <p role="alert" className="text-destructive text-sm">
            {serverError}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? m.auth_creating_account() : m.auth_sign_up()}
        </Button>
      </form>
      <p className="text-muted-foreground mt-4 text-center text-sm">
        {m.auth_have_account()}{" "}
        <Link to="/login" className="text-primary underline">
          {m.auth_sign_in()}
        </Link>
      </p>
    </AuthPageLayout>
  );
}
