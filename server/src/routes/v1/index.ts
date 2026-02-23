import { Elysia } from "elysia";

import { configRoute } from "./config";
import { graphsRoute } from "./graphs";

export const v1 = new Elysia({ prefix: "/v1" }).use(graphsRoute).use(configRoute);
