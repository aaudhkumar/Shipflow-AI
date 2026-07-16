import "dotenv/config";
import { db } from "@shipflow/db";
import { organizations, prds, epics, tasks } from "@shipflow/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import TaskExecutionService from "@shipflow/services/task-execution";

async function main() {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "aaudhkumar")
  });
  
  const orgPrds = await db.query.prds.findMany({
    where: eq(prds.orgId, org!.id),
    limit: 1
  });
  
  const prd = orgPrds[0];
  console.log(`Found PRD: ${prd.id}. Resetting tasks...`);
  
  const epicsList = await db.query.epics.findMany({
    where: and(eq(epics.prdId, prd.id), eq(epics.orgId, org!.id))
  });
  const epicIds = epicsList.map(e => e.id);
  
  await db.update(tasks).set({ executionStatus: "not_started" }).where(inArray(tasks.epicId, epicIds));
  
  const service = new TaskExecutionService();
  const res = await service.requestImplementation({ prdId: prd.id, orgId: org!.id });
  
  console.log("Triggered implementation! Result:", res);
}

main().catch(console.error).finally(() => process.exit(0));
