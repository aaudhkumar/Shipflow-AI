import { db } from "./index";
import { deployments } from "./models/deployments";

async function main() {
  await db.delete(deployments);
  console.log("Deleted all deployments data.");
  process.exit(0);
}

main().catch(console.error);
