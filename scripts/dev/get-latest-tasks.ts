import "dotenv/config";
import { db } from "@shipflow/db";
import { tasks } from "@shipflow/db/schema";
import { desc } from "drizzle-orm";

async function main() {
  const latestTasks = await db.query.tasks.findMany({
    orderBy: [desc(tasks.updatedAt)],
    limit: 5
  });
  
  for (const t of latestTasks) {
    console.log(`Task: ${t.id} | Status: ${t.status} | Execution: ${t.executionStatus} | Error: ${t.lastError}`);
  }
}

main().catch(console.error).finally(() => process.exit(0));
