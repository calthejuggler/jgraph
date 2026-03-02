import { createLazyFileRoute } from "@tanstack/react-router";

import { VerifyEmailPage } from "@/pages/verify-email";

export const Route = createLazyFileRoute("/verify-email")({
  component: VerifyEmailPage,
});
