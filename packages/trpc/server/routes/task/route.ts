import { router, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { db } from "@shipflow/db";
import { prds, epics, tasks, projects, featureRequests } from "@shipflow/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { generatePath } from "../../utils/path-generator";
import {
  getKanbanOutputSchema,
  updateTaskStatusOutputSchema,
  batchUpdateTaskStatusOutputSchema,
  assignTaskOutputSchema,
  getMyTasksOutputSchema
} from "@shipflow/services/task/model";

const TAGS = ["Task"];
const getPath = generatePath("/tasks");

export const taskRouter = router({
  getKanban: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/features/{featureId}/kanban"), tags: TAGS } })
    .input(z.object({ featureId: z.string() }))
    .output(getKanbanOutputSchema)
    .query(async ({ input }) => {
      const prd = await db.query.prds.findFirst({
        where: eq(prds.featureRequestId, input.featureId)
      });
      if (!prd) return { TODO: [], IN_PROGRESS: [], DONE: [] };

      const featureEpics = await db.query.epics.findMany({
        where: eq(epics.prdId, prd.id)
      });
      
      const epicIds = featureEpics.map(e => e.id);
      
      let allTasks: any[] = [];
      if (epicIds.length > 0) {
        allTasks = await db.query.tasks.findMany({
          where: inArray(tasks.epicId, epicIds),
          with: { 
            subtasks: true,
            pullRequests: {
              with: {
                reviews: true
              }
            }
          }
        });
      }
      
      let epic = null;
      if (featureEpics.length > 0) {
        epic = featureEpics[0];
      }
      
      const grouped = {
        TODO: allTasks.filter(t => t.status === "TODO" || t.status === "BACKLOG"),
        IN_PROGRESS: allTasks.filter(t => t.status === "IN_PROGRESS"),
        DONE: allTasks.filter(t => t.status === "DONE" || t.status === "IN_REVIEW"),
        epic
      };
      
      return grouped;
    }),
    
  updateStatus: orgMemberProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/{taskId}/status"), tags: TAGS } })
    .input(z.object({ taskId: z.string(), status: z.enum(["TODO", "IN_PROGRESS", "DONE"]) }))
    .output(updateTaskStatusOutputSchema)
    .mutation(async ({ input }) => {
      const [updated] = await db.update(tasks)
        .set({ status: input.status })
        .where(eq(tasks.id, input.taskId))
        .returning();
        
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      return updated;
    }),
    
  batchUpdateStatus: orgMemberProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/batch/status"), tags: TAGS } })
    .input(z.object({ taskIds: z.array(z.string()), status: z.enum(["TODO", "IN_PROGRESS", "DONE"]) }))
    .output(batchUpdateTaskStatusOutputSchema)
    .mutation(async ({ input }) => {
      if (input.taskIds.length === 0) return [];
      
      const updated = await db.update(tasks)
        .set({ status: input.status })
        .where(inArray(tasks.id, input.taskIds))
        .returning();
        
      return updated;
    }),
    
  assignTask: orgMemberProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/{taskId}/assign"), tags: TAGS } })
    .input(z.object({ taskId: z.string(), assigneeId: z.string().nullable() }))
    .output(assignTaskOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const [updated] = await db.update(tasks)
        .set({ assigneeId: input.assigneeId })
        .where(eq(tasks.id, input.taskId))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      return updated;
    }),
    
  getMyTasks: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}/me"), tags: TAGS } })
    .input(z.object({ orgId: z.string() }))
    .output(getMyTasksOutputSchema)
    .query(async ({ input, ctx }) => {
      const allTasks = await db.query.tasks.findMany({
        where: and(eq(tasks.orgId, input.orgId), eq(tasks.assigneeId, ctx.member.id)),
        with: {
          epic: {
            with: {
              project: true,
              prd: {
                with: {
                  featureRequest: true
                }
              }
            }
          }
        }
      });
      
      const grouped = {
        TODO: allTasks.filter(t => t.status === "TODO" || t.status === "BACKLOG"),
        IN_PROGRESS: allTasks.filter(t => t.status === "IN_PROGRESS"),
        DONE: allTasks.filter(t => t.status === "DONE"),
      };
      
      return grouped;
    })
});
