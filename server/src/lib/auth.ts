import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  trustedOrigins: [Bun.env.CORS_ORIGIN ?? "http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
  },
});
