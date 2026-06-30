import "dotenv/config";
import { db } from "./packages/db/index.ts";
import { repositories } from "./packages/db/schema.ts";
async function run() {
  const repos = await db.select().from(repositories);
  console.log(repos);
  process.exit(0);
}
run();
