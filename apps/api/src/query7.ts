import { db } from "@shipflow/db";
import { repositories } from "@shipflow/db/schema";

async function run() {
  const repos = await db.query.repositories.findMany();
  console.log(repos);
}
run();
