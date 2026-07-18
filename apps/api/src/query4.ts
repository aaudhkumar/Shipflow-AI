import { db } from "@shipflow/db";
import { projects } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const p = await db.query.projects.findFirst({
    where: eq(projects.id, 'dec134be-1926-4e0c-aa68-36e85edc27cf')
  });
  console.log(p?.contextDocument);
}
run();
