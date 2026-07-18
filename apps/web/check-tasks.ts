import { db } from "@shipflow/db";
import { tasks, epics, prds } from "@shipflow/db/schema";
import { eq } from "@shipflow/db";


async function main() {
  const featureId = "d2eaf1b3-93d9-477d-b3c7-2addc0a307b6";
  const prd = await db.query.prds.findFirst({ where: eq(prds.featureRequestId, featureId) });
  if (!prd) return;
  const epic = await db.query.epics.findFirst({ where: eq(epics.prdId, prd.id) });
  if (!epic) return;
  const taskList = await db.query.tasks.findMany({ where: eq(tasks.epicId, epic.id) });
  console.log(taskList.map(t => ({ id: t.id, status: t.status, executionStatus: t.executionStatus, attemptCount: t.attemptCount })));
  process.exit(0);
}
main();
