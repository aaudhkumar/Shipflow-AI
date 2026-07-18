import { db } from "./index";
import { subscriptions } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const result = await db.update(subscriptions)
      .set({ usageLimit: 100 })
      .where(eq(subscriptions.usageLimit, 70))
      .returning();
    console.log("Updated subscriptions:", result.length);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
main();
