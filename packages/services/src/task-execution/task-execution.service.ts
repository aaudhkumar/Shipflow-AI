import { db } from "@shipflow/db";
import { tasks, taskToolCalls, prds, epics } from "@shipflow/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { inngest } from "../workflow/client";
import { ApproveForDevelopmentInput, TaskExecutionItem, ToolCallLogItem } from "./model";
import { redactSecrets } from "./redact";

class TaskExecutionService {
  /**
   * Called from the tRPC mutation. Flips eligible tasks to "ready" and fires the
   * one event that hands off to the execution plane. Returns immediately.
   */
  public async requestImplementation(input: ApproveForDevelopmentInput): Promise<{ taskCount: number }> {
    const epicsList = await db.select({ id: epics.id }).from(epics).where(and(eq(epics.prdId, input.prdId), eq(epics.orgId, input.orgId)));
    const epicIds = epicsList.map(e => e.id);

    console.log("[task-execution] requestImplementation called:", input);
    console.log("[task-execution] Found epics:", epicIds);

    if (epicIds.length === 0) {
      console.log("[task-execution] No epics found for this PRD!");
      return { taskCount: 0 };
    }

    const result = await db
      .update(tasks)
      .set({ executionStatus: "ready", attemptCount: 0 }) // Reset attempts on manual re-approval
      .where(and(
        inArray(tasks.epicId, epicIds),
        eq(tasks.orgId, input.orgId), // enforce multi-tenancy as requested
        inArray(tasks.executionStatus, ["not_started", "ready", "failed"])
      ))
      .returning({ id: tasks.id });

    console.log(`[task-execution] Updated ${result.length} tasks to ready.`);

    if (result.length === 0) return { taskCount: 0 };
    
    // Set feature status to IN_DEVELOPMENT
    const { featureRequests } = await import("@shipflow/db/schema");
    const prdData = await db.query.prds.findFirst({
      where: and(eq(prds.id, input.prdId), eq(prds.orgId, input.orgId))
    });
    if (prdData) {
      await db.update(featureRequests)
        .set({ status: "IN_DEVELOPMENT", updatedAt: new Date() })
        .where(eq(featureRequests.id, prdData.featureRequestId));
        
      const { createAuditLog, AuditAction } = await import("@shipflow/services/audit");
      await createAuditLog({
        orgId: input.orgId, actorId: null, action: AuditAction.FEATURE_IN_DEVELOPMENT,
        resourceType: 'FEATURE', resourceId: prdData.featureRequestId,
        metadata: { source: "agent_assigned" }
      });
    }

    await inngest.send({
      name: "tasks.approved_for_dev",
      data: { prdId: input.prdId, orgId: input.orgId, taskIds: result.map((r) => r.id) },
    } as any); // Type cast for now until we update the events schema

    return { taskCount: result.length };
  }

  /**
   * The ONLY correctness-critical query in this service — atomic claim.
   * Called by the orchestrator job, never directly from a tRPC route.
   */
  public async claimNextReadyTask(prdId: string, runId: string) {
    const result = await db.execute(sql`
      UPDATE tasks SET execution_status = 'claimed', claimed_by_run_id = ${runId},
        claimed_at = now(), attempt_count = attempt_count + 1
      WHERE id = (
        SELECT t.id FROM tasks t
        JOIN epics e ON t.epic_id = e.id
        WHERE e.prd_id = ${prdId} AND t.execution_status IN ('ready', 'failed') AND t.attempt_count < 3
        ORDER BY t.created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED
      )
      RETURNING *;
    `);
    
    const claimed = result.rows[0];
    
    if (claimed) {
      // Map to Kanban board
      const task = claimed as any;
      if (task.status === 'TODO') {
        await db.update(tasks).set({ status: 'IN_PROGRESS' }).where(eq(tasks.id, task.id));
      }
    }
    
    return claimed ?? null;
  }

  public async markTaskStatus(
    taskId: string,
    executionStatus: "in_progress" | "done" | "failed" | "blocked",
    opts?: { branchName?: string; commitSha?: string; error?: string },
  ) {
    await db.update(tasks).set({
      executionStatus: executionStatus,
      branchName: opts?.branchName,
      commitSha: opts?.commitSha,
      lastError: opts?.error,
    }).where(eq(tasks.id, taskId));

    if (executionStatus === "done") {
      // Done executing, moving to DONE column
      await db.update(tasks).set({ status: "DONE" }).where(eq(tasks.id, taskId));
    }
    
    console.log(`task ${taskId} -> ${executionStatus}`, { taskId, executionStatus });
  }

  /** Audit log write — input/output are redacted BEFORE this is called, never after. */
  public async logToolCall(taskId: string, toolName: string, input: unknown, outputSummary: string) {
    await db.insert(taskToolCalls).values({
      taskId,
      toolName,
      inputRedacted: redactSecrets(input),
      outputSummary: outputSummary.slice(0, 4000),
    });
  }

  public async getExecutionTimeline(prdId: string, orgId: string): Promise<TaskExecutionItem[]> {
    return db.select({
      id: tasks.id,
      title: tasks.title,
      executionStatus: tasks.executionStatus,
      attemptCount: tasks.attemptCount,
      lastError: tasks.lastError,
      branchName: tasks.branchName,
      commitSha: tasks.commitSha,
    })
    .from(tasks)
    .innerJoin(epics, eq(tasks.epicId, epics.id))
    .where(and(eq(epics.prdId, prdId), eq(tasks.orgId, orgId)));
  }

  public async getToolCallLog(taskId: string, orgId: string): Promise<ToolCallLogItem[]> {
    return db.select({
      id: taskToolCalls.id,
      toolName: taskToolCalls.toolName,
      outputSummary: taskToolCalls.outputSummary,
      createdAt: taskToolCalls.createdAt,
    })
    .from(taskToolCalls)
    .innerJoin(tasks, eq(tasks.id, taskToolCalls.taskId))
    .where(and(eq(taskToolCalls.taskId, taskId), eq(tasks.orgId, orgId)));
  }

  /**
   * Staleness recovery — call on a schedule so a crashed run
   * never leaves a task stuck `claimed` forever.
   */
  public async releaseStaleClaims(olderThanMinutes = 10) {
    await db.execute(sql`
      UPDATE tasks SET execution_status = 'ready', claimed_by_run_id = NULL
      WHERE execution_status = 'claimed' AND claimed_at < now() - interval '${sql.raw(String(olderThanMinutes))} minutes';
    `);
  }
}

export default TaskExecutionService;
