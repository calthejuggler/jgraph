import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "../src/db";
import { users } from "../src/db/schema/auth";

const seedAuth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  plugins: [admin({ defaultRole: "user" })],
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: {
    enabled: false,
  },
});

const PASSWORD = "password123";

const seedUsers = [
  { name: "Admin", email: "admin@example.com", role: "admin" },
  { name: "Super Admin", email: "superadmin@example.com", role: "admin" },
  { name: "Alice", email: "alice@example.com", role: "user" },
  { name: "Bob", email: "bob@example.com", role: "user" },
  { name: "Charlie", email: "charlie@example.com", role: "user" },
  { name: "Diana", email: "diana@example.com", role: "user" },
  { name: "Eve", email: "eve@example.com", role: "user" },
  { name: "Frank", email: "frank@example.com", role: "user" },
  { name: "Grace", email: "grace@example.com", role: "user" },
  { name: "Hank", email: "hank@example.com", role: "user" },
  {
    name: "Banned Barry",
    email: "banned.barry@example.com",
    role: "user",
    banned: true,
    banReason: "Spamming",
  },
  {
    name: "Blocked Brenda",
    email: "blocked.brenda@example.com",
    role: "user",
    banned: true,
    banReason: "TOS violation",
  },
] as const;

async function seed() {
  console.log("Seeding database...\n");

  for (const userData of seedUsers) {
    const { name, email, role, ...extra } = userData;

    const res = await seedAuth.api.signUpEmail({
      body: { name, email, password: PASSWORD },
    });

    if (res.user) {
      const updates: Record<string, unknown> = {};
      if (role !== "user") updates.role = role;
      if ("banned" in extra) updates.banned = extra.banned;
      if ("banReason" in extra) updates.banReason = extra.banReason;

      if (Object.keys(updates).length > 0) {
        await db.update(users).set(updates).where(eq(users.id, res.user.id));
      }

      console.log(
        `  Created: ${email} (${role}${"banned" in extra && extra.banned ? ", banned" : ""})`,
      );
    } else {
      console.log(`  Skipped: ${email} (already exists)`);
    }
  }

  console.log(`\nDone! All users use password: ${PASSWORD}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
