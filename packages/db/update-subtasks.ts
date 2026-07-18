import { db } from "@shipflow/db";
import { tasks, subtasks } from "@shipflow/db/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const completedTasks = await db.query.tasks.findMany({
    where: (t, { or, eq }) => or(eq(t.status, "DONE"), eq(t.status, "IN_REVIEW")),
  });

  const taskIds = completedTasks.map((t) => t.id);

  if (taskIds.length > 0) {
    await db.update(subtasks)
      .set({ isCompleted: true })
      .where(inArray(subtasks.taskId, taskIds));
    console.log(`Updated subtasks for ${taskIds.length} completed/in-review tasks.`);
  } else {
    console.log("No completed/in-review tasks found.");
  }
}

main().catch(console.error);
