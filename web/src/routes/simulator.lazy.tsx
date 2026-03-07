import { createLazyFileRoute } from "@tanstack/react-router";

import { SimulatorPage } from "@/pages/simulator";

export const Route = createLazyFileRoute("/simulator")({
  component: SimulatorPage,
});
