import { createLazyFileRoute } from "@tanstack/react-router";

import { ForgotPasswordPage } from "@/pages/forgot-password";

export const Route = createLazyFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});
