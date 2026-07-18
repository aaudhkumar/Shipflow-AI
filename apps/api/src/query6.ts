import { db } from "@shipflow/db";
import { deployments } from "@shipflow/db/schema";
import { sql } from "drizzle-orm";

async function run() {
  const result = await db.execute(sql`SELECT * FROM deployments`);
  console.log("Total deployments:", result.rowCount);
  console.log(result.rows);
}
run();
