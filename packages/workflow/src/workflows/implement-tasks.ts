import { inngest } from "../../../services/src/workflow/client";
import TaskExecutionService from "@shipflow/services/task-execution";

// Instantiate it here to avoid any cyclic injection issues, it's stateless
const taskExecutionService = new TaskExecutionService();

export const implementFeatureTasks = inngest.createFunction(
  { id: "implement-feature-tasks", concurrency: { limit: 1, key: "event.data.prdId" }, retries: 2 },
  { event: "tasks.approved_for_dev" },
  async ({ event, step }) => {
    let claimed: any;
    while ((claimed = await step.run("claim-next-task", () =>
      taskExecutionService.claimNextReadyTask(event.data.prdId, event.id as string),
    ))) {
      await step.run(`mark-in-progress-${claimed.id}`, () =>
        taskExecutionService.markTaskStatus(claimed.id, "in_progress"));

      await step.run(`trigger-${claimed.id}`, async () => {
        const isDev = process.env.NODE_ENV === "development";
        const workerUrl = isDev 
          ? "http://localhost:3004" 
          : (process.env.CODE_WORKER_URL || "https://shipflow-ai.onrender.com");
          
        const res = await fetch(`${workerUrl}/implement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: claimed.id }),
        });
        if (!res.ok) throw new Error("Worker failed to accept request");
      });

      // Wait for the worker to finish and send the completion event (up to 15 mins)
      const resultEvent = await step.waitForEvent(`wait-for-${claimed.id}`, {
        event: "tasks.implementation.completed",
        timeout: "15m",
        if: `async.data.taskId == '${claimed.id}'`
      });

      if (!resultEvent) {
         // Timed out
         await step.run(`mark-timeout-${claimed.id}`, () =>
           taskExecutionService.markTaskStatus(claimed.id, "failed", { error: "Worker timed out after 15 minutes." }));
         continue; // Move to the next task
      }

      const result = resultEvent.data;

      await step.run(`mark-result-${claimed.id}`, () =>
        taskExecutionService.markTaskStatus(claimed.id, result.success ? "done" : "failed", {
          branchName: result.branch, commitSha: result.commitSha, error: result.error,
        }));
    }
  },
);

export const releaseStaleClaims = inngest.createFunction(
  { id: "release-stale-claims" },
  { cron: "*/10 * * * *" },
  async () => taskExecutionService.releaseStaleClaims(10),
);
