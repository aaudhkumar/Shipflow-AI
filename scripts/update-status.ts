import { db } from "../packages/db/src";
import { featureRequests } from "../packages/db/src/schema";
import { eq } from "drizzle-orm";

async function main() {
  const featureId = "d2eaf1b3-93d9-477d-b3c7-2addc0a307b6";
  await db.update(featureRequests).set({ status: "IN_DEVELOPMENT" }).where(eq(featureRequests.id, featureId));
  console.log("Updated feature to IN_DEVELOPMENT");
  process.exit(0);
}
main();
