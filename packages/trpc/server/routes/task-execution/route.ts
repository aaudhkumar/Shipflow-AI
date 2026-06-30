import { z } from "zod";
import { taskExecutionService } from "../../services";
import {
  approveForDevelopmentInputSchema,
  taskExecutionItemSchema,
  toolCallLogItemSchema,
} from "@shipflow/services/task-execution/model";
import { orgMemberProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Task Execution"];
const getPath = generatePath("/task-execution");

export const taskExecutionRouter = router({
  approveForDevelopment: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/approve"), tags: TAGS } })
    .input(approveForDevelopmentInputSchema)
    .output(z.object({ taskCount: z.number() }))
    .mutation(async ({ input }) => taskExecutionService.requestImplementation(input)),

  getExecutionTimeline: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/timeline"), tags: TAGS } })
    .input(z.object({ orgId: z.string().uuid(), prdId: z.string().uuid() }))
    .output(z.array(taskExecutionItemSchema))
    .query(async ({ input }) => taskExecutionService.getExecutionTimeline(input.prdId, input.orgId)),

  getToolCallLog: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{taskId}/tool-calls"), tags: TAGS } })
    .input(z.object({ orgId: z.string().uuid(), taskId: z.string().uuid() }))
    .output(z.array(toolCallLogItemSchema))
    .query(async ({ input }) => taskExecutionService.getToolCallLog(input.taskId, input.orgId)),
});
