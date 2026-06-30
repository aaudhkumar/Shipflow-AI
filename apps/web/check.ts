import { db } from "../../packages/db/src/index";
import { tasks, epics } from "../../packages/db/models/schema";
import { inArray, and, eq } from "drizzle-orm";

async function run() {
  const allTasks = await db.select({ id: tasks.id, executionStatus: tasks.executionStatus, epicId: tasks.epicId, orgId: tasks.orgId }).from(tasks);
  console.log("Total tasks:", allTasks.length);
  if (allTasks.length > 0) {
    const readyTasks = allTasks.filter(t => t.executionStatus === "ready");
    const notStartedTasks = allTasks.filter(t => t.executionStatus === "not_started");
    console.log("Tasks ready:", readyTasks.length);
    console.log("Tasks not_started:", notStartedTasks.length);
  }
}

run().catch(console.error).then(() => process.exit(0));
