import { db } from "@shipflow/db";
import { deployments } from "@shipflow/db/schema";

async function run() {
  await db.insert(deployments).values({
    repositoryId: 'dc2e77b2-d196-4534-af95-174e508ea629',
    commitSha: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    environment: 'production',
    status: 'SUCCESS',
    deploymentUrl: 'https://shipflow.com/demo-deployment',
    createdAt: new Date(),
  });
  console.log("Mock deployment inserted");
}
run();
