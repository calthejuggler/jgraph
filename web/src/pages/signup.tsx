import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";

import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth-client";
import { signupSchema, type SignupValues } from "@/lib/schemas";

import { m } from "@/paraglide/messages.js";

export function SignupPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SignupValues) {
    setServerError("");
    try {
      const res = await signUp.email(values);
      if (res.error) {
        setServerError(res.error.message ?? m.auth_signup_failed());
      } else {
        navigate({ to: "/", search: { num_props: 3, max_height: 5, view: "graph" } });
      }
    } catch {
      setServerError(m.auth_unexpected_error());
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LocaleToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{m.auth_create_account()}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">{m.auth_name_label()}</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    type="text"
                    placeholder={m.auth_name_placeholder()}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">{m.auth_email_label()}</FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder={m.auth_email_placeholder()}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">{m.auth_password_label()}</FieldLabel>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    placeholder={m.auth_password_placeholder_signup()}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            {serverError && <p className="text-destructive text-sm">{serverError}</p>}
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
        </CardContent>
      </Card>
    </div>
  );
}
