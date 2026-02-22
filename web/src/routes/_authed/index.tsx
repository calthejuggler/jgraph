import { createFileRoute } from "@tanstack/react-router";
import { GraphsPage } from "@/pages/graphs";

export const Route = createFileRoute("/_authed/")({
  component: GraphsPage,
});
