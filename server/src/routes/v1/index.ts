import { Elysia } from "elysia";

import { configRoute } from "./config";
import { stateNotationRoutes } from "./state-notation";

export const v1 = new Elysia({ prefix: "/v1" }).use(stateNotationRoutes).use(configRoute);
