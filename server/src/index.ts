import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "./lib/auth";
import { loggingPlugin } from "./lib/logging";
import { logger } from "./lib/logger";
import { routes } from "./routes";

const app = new Elysia()
  .use(cors({ origin: Bun.env.CORS_ORIGIN ?? "http://localhost:5173", credentials: true }))
  .use(loggingPlugin)
  .use(routes)
  .mount(auth.handler)
  .get("/", () => "Hello Elysia")
  .listen(3000);

logger.info({
  event: "server_started",
  host: app.server?.hostname,
  port: app.server?.port,
});
