import { Elysia } from "elysia";

import { graphRoute } from "./graph";
import { tableRoute } from "./table";

export const stateNotationRoutes = new Elysia({ prefix: "/state-notation" })
  .use(graphRoute)
  .use(tableRoute);
