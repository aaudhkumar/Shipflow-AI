import { db } from "./packages/db/index";
import * as schema from "./packages/db/models/index";
import { eq, and, inArray } from "drizzle-orm";

async function run() {
  const prdId = '7eb7fce4-6303-457f-8f96-8d1cc60b167b'; // the one from the DB dump
  const orgId = '84083639-9063-4bbb-a571-b0a6a2c2be84';
  
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
