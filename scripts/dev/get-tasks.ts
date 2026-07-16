import "dotenv/config";
import { db } from "@shipflow/db";
import { organizations, prds, tasks, epics } from "@shipflow/db/schema";
import { eq, inArray, and } from "drizzle-orm";

async function main() {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "aaudhkumar")
  });
  
  const orgPrds = await db.query.prds.findMany({
    where: eq(prds.orgId, org!.id),
    limit: 1
  });
  
  const prd = orgPrds[0];
  
  const epicsList = await db.query.epics.findMany({
    where: and(eq(epics.prdId, prd.id), eq(epics.orgId, org!.id))
  });
  const epicIds = epicsList.map(e => e.id);
  
  const orgTasks = await db.query.tasks.findMany({
    where: inArray(tasks.epicId, epicIds)
  });
  
  console.log("Tasks for this PRD:", orgTasks.map(t => ({ id: t.id, executionStatus: t.executionStatus })));
}

main().catch(console.error).finally(() => process.exit(0));
