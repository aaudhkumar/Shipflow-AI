import { db } from "@shipflow/db";
import { deployments } from "@shipflow/db/schema";

async function run() {
  const all = await db.query.deployments.findMany();
  console.log(all);
}
run();
