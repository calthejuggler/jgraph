import { createLazyFileRoute } from "@tanstack/react-router";

import { ResetPasswordPage } from "@/pages/reset-password";

export const Route = createLazyFileRoute("/reset-password")({
  component: ResetPasswordPage,
});
