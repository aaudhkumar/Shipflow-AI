import { hashPassword } from "@better-auth/utils/password";
import { db } from "./index";
import { accounts, users } from "./schema";
import { eq } from "drizzle-orm";

async function fixPassword() {
  const hash = await hashPassword("demo@2026");
  console.log("Generated hash:", hash);

  const [user] = await db.select().from(users).where(eq(users.email, "demo@demo.com"));
  if (!user) {
    console.error("User not found!");
    return;
  }

  await db.update(accounts)
    .set({ password: hash })
    .where(eq(accounts.userId, user.id));
  
  console.log("Password hash updated successfully.");
}

fixPassword().catch(console.error);
