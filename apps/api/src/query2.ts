import { db } from "@shipflow/db";
import { featureRequests } from "@shipflow/db/schema";
import { ilike } from "drizzle-orm";

async function run() {
  const features = await db.query.featureRequests.findMany({
    with: { project: true }
  });
  console.log(JSON.stringify(features.map(f => ({ id: f.id, title: f.title, status: f.status, projectId: f.projectId })), null, 2));
}
run();
