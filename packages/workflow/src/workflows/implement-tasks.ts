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

      // For now, stub the call to codeWorkerClient
      const result = await step.run(`implement-${claimed.id}`, async () => {
        // Will implement in Step 7
        try {
          const res = await fetch("http://localhost:3004/implement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: claimed.id }),
          });
          if (!res.ok) throw new Error("Worker failed");
          return await res.json();
        } catch (e) {
          console.error(e);
          return { success: false, error: String(e) };
        }
      });

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
