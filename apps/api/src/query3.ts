import { db } from "@shipflow/db";
import { featureRequests } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const features = await db.query.featureRequests.findMany({
    where: eq(featureRequests.projectId, 'dec134be-1926-4e0c-aa68-36e85edc27cf')
  });
  console.log(JSON.stringify(features.map(f => ({ id: f.id, title: f.title, status: f.status })), null, 2));
}
run();
