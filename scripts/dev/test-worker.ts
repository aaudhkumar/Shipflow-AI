import "dotenv/config";
import { db } from "@shipflow/db";
import { organizations, prds, epics, tasks } from "@shipflow/db/schema";
import { eq, and, inArray } from "drizzle-orm";

async function main() {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "aaudhkumar")
  });
  
  const orgPrds = await db.query.prds.findMany({
    where: eq(prds.orgId, org!.id),
    limit: 1
  });
  
  const epicsList = await db.query.epics.findMany({
    where: and(eq(epics.prdId, orgPrds[0].id), eq(epics.orgId, org!.id))
  });
  
  const orgTasks = await db.query.tasks.findMany({
    where: inArray(tasks.epicId, epicsList.map(e => e.id)),
    limit: 1
  });
  
  const task = orgTasks[0];
  console.log(`Testing with Task ID: ${task.id}`);
  
  console.log(`Sending request to https://shipflow-ai.onrender.com/implement...`);
  try {
    const res = await fetch("https://shipflow-ai.onrender.com/implement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id })
    });
    
    if (!res.ok) {
      console.log("Error status:", res.status, res.statusText);
      const text = await res.text();
      console.log("Error response:", text);
    } else {
      const data = await res.json();
      console.log("Success! Worker response:", data);
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

main().catch(console.error).finally(() => process.exit(0));
