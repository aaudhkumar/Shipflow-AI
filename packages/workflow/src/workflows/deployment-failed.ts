import { inngest } from "@shipflow/services/src/workflow/client";
import { db } from "@shipflow/db";
import { repositories } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

export const handleDeploymentFailed = inngest.createFunction(
  { id: "deployment-failed" },
  { event: "deployment.failed" },
  async ({ event, step }) => {
    const { deploymentId, repositoryId, commitSha, environment } = event.data;

    // 1. Fetch Repository info
    const repo = await step.run("fetch-repository-info", async () => {
      const record = await db.query.repositories.findFirst({
        where: eq(repositories.id, repositoryId)
      });
      if (!record) {
        throw new Error(`Repository not found: ${repositoryId}`);
      }
      return record;
    });

    // 2. Alert the engineering team
    // In a real application, you might use Slack API, email, or PagerDuty
    await step.run("alert-engineering-team", async () => {
      console.error(`Deployment Failed: ${repo.fullName} (${environment}) - Commit: ${commitSha}`);
      // Simulate sending alert
      return { success: true, notified: "engineering-channel" };
    });

    return { event: "deployment.failed", processed: true, deploymentId };
  }
);
