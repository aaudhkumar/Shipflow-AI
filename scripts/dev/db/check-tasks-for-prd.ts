import { db } from "@shipflow/db";
import * as schema from "@shipflow/db/schema";
import { eq, and, inArray } from "drizzle-orm";

async function run() {
  const prdId = process.argv[2];
  const orgId = process.argv[3];
  
  if (!prdId || !orgId) {
    console.error('Usage: tsx check-tasks-for-prd.ts <prd-id> <org-id>');
    process.exit(1);
  }
  
  const epicsList = await db.select({ id: schema.epics.id }).from(schema.epics).where(and(eq(schema.epics.prdId, prdId), eq(schema.epics.orgId, orgId)));
  const epicIds = epicsList.map(e => e.id);
  
  console.log("Found epicIds:", epicIds);
  
  const tasksToUpdate = await db.select().from(schema.tasks).where(and(
    inArray(schema.tasks.epicId, epicIds),
    eq(schema.tasks.orgId, orgId),
    eq(schema.tasks.executionStatus, "not_started")
  ));
  
  console.log("Tasks to update:", tasksToUpdate.length);
}
run().catch(console.error).then(() => process.exit(0));
