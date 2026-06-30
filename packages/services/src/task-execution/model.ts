import { z } from "zod";

export const approveForDevelopmentInputSchema = z.object({
  orgId: z.string().uuid(),
  prdId: z.string().uuid(),
});
export type ApproveForDevelopmentInput = z.infer<typeof approveForDevelopmentInputSchema>;

export const taskExecutionItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  executionStatus: z.enum([
    "not_started", "ready", "claimed", "in_progress", "done", "failed", "blocked",
  ]),
  attemptCount: z.number(),
  lastError: z.string().nullable(),
  branchName: z.string().nullable(),
  commitSha: z.string().nullable(),
});
export type TaskExecutionItem = z.infer<typeof taskExecutionItemSchema>;

export const toolCallLogItemSchema = z.object({
  id: z.string().uuid(),
  toolName: z.string(),
  outputSummary: z.string(),
  createdAt: z.date(),
});
export type ToolCallLogItem = z.infer<typeof toolCallLogItemSchema>;
