import { db } from "@shipflow/db";
import { organizations, users } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

export default async function globalTeardown() {
  console.log("Running global teardown...");
  await db.delete(organizations).where(eq(organizations.slug, "test-org"));
  await db.delete(users).where(eq(users.email, "test@shipflow.me"));
}
