import { Link } from "@tanstack/react-router";

import { AuthPageLayout } from "@/components/auth-page-layout";

import { m } from "@/paraglide/messages.js";

export function VerifyEmailPage() {
  return (
    <AuthPageLayout title={m.auth_verify_email_title()}>
      <div className="space-y-4">
        <p className="text-destructive text-center text-sm">{m.auth_verify_email_failed()}</p>
        <Link to="/login" className="text-primary block text-center text-sm underline">
          {m.auth_back_to_login()}
        </Link>
      </div>
    </AuthPageLayout>
  );
}
